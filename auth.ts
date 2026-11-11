import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import {
    admin,
    lastLoginMethod,
    organization,
    username,
} from "better-auth/plugins";
import { env } from "~/env";
import { signInMethod } from "~/lib/analytics";
import { isDevUsername } from "~/lib/auth/dev-accounts";
import { devLoginEnabled } from "~/lib/auth/dev-login";
import { LAST_LOGIN_METHOD_COOKIE } from "~/lib/auth/last-login";
import { isBlockedAuthPath } from "~/lib/auth/organization-endpoints";
import {
    isBlockedEmailPath,
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH,
} from "~/lib/auth/usernames";
import { accessControl, adminPluginRoles } from "~/lib/auth/permissions";
import { isSiteAdmin } from "~/lib/auth/roles";
import { recordActivity, recordAuthEvent } from "~/server/analytics";
import { db } from "~/server/db";
import { oauth } from "~/server/oauth";
import * as authSchema from "~/server/db/schema/auth";
import * as orgSchema from "~/server/db/schema/organization";
import { schoolsOf } from "~/server/organizations";

export const auth = betterAuth({
    baseURL: env.BASE_URL,
    trustedOrigins: [env.BETTER_AUTH_URL],
    database: drizzleAdapter(db, {
        provider: "pg",
        // Keys must match the modelName configured for each model below so
        // Better Auth can resolve the correct Drizzle table object at runtime.
        schema: {
            uil_user: authSchema.user,
            uil_session: authSchema.session,
            uil_account: authSchema.account,
            uil_verification: authSchema.verification,
            uil_organization: orgSchema.organization,
            uil_member: orgSchema.member,
            uil_invitation: orgSchema.invitation,
        },
    }),
    plugins: [
        // Organizations are schools. Users can belong to several; the
        // session's activeOrganizationId says which one they're acting in.
        organization({
            // Schools are set up by site admins, not self-serve. (Creating,
            // deleting, and most other plugin endpoints are also refused by
            // the `hooks.before` below; this is a second line of defense.)
            // The plugin types `user` without our additional fields.
            allowUserToCreateOrganization: (user) =>
                isSiteAdmin(user.role as string | undefined),
            disableOrganizationDeletion: true,
            schema: {
                organization: {
                    modelName: "uil_organization",
                    // UIL classification. Not settable through the auth API
                    // (input: false), so teachers can't reclassify their own
                    // school; site admins set it.
                    additionalFields: {
                        conference: {
                            type: "string",
                            required: false,
                            input: false,
                        },
                        district: {
                            type: "number",
                            required: false,
                            input: false,
                        },
                        region: {
                            type: "number",
                            required: false,
                            input: false,
                        },
                    },
                },
                member: { modelName: "uil_member" },
                invitation: { modelName: "uil_invitation" },
            },
        }),
        // User management for site admins: banning (which also signs the
        // user out everywhere), impersonation, roles. Uses the same `role`
        // column as the rest of the site, so its roles are ours.
        admin({
            ac: accessControl,
            roles: adminPluginRoles,
            adminRoles: ["site-admin"],
            defaultRole: "student",
            bannedUserMessage:
                "Your account has been suspended. Contact your teacher or a site admin if you think this is a mistake.",
        }),
        // Username + password sign-in, for students who can't use Google.
        // These accounts have no real email (src/lib/auth/usernames.ts);
        // they're created by src/app/sign-in/sign-up-action.ts.
        username({
            minUsernameLength: USERNAME_MIN_LENGTH,
            maxUsernameLength: USERNAME_MAX_LENGTH,
        }),
        // Remembers (in a cookie) how this browser last signed in, so the
        // sign-in page can mark it "Last used". Our signInMethod also knows
        // /sign-in/username, which the plugin's default doesn't.
        lastLoginMethod({
            cookieName: LAST_LOGIN_METHOD_COOKIE,
            customResolveMethod: (ctx) => signInMethod(ctx),
        }),
    ],
    hooks: {
        before: createAuthMiddleware(async (ctx) => {
            // Refuse the organization plugin's endpoints the site doesn't
            // use (src/lib/auth/organization-endpoints.ts), for browser
            // requests and server-side `auth.api` calls alike.
            if (isBlockedAuthPath(ctx.path)) {
                throw new APIError("NOT_FOUND");
            }
            // No email sign-in, sign-up, or emails from the browser (see
            // isBlockedEmailPath). Server code (which has no `request`) may
            // still create username accounts through /sign-up/email.
            if (ctx.request && isBlockedEmailPath(ctx.path)) {
                throw new APIError("NOT_FOUND");
            }
            // The dev accounts share a known password, so they only work
            // where dev login is on (src/lib/auth/dev-login.ts).
            if (
                ctx.path === "/sign-in/username" &&
                isDevUsername((ctx.body as { username?: unknown })?.username) &&
                !devLoginEnabled()
            ) {
                throw new APIError("UNAUTHORIZED", {
                    message: "Invalid username or password",
                });
            }
        }),
        // Every signed-in page load and API call reads the session, so this
        // is where activity is noticed (for the admin analytics page). Not
        // while a site admin is impersonating the user.
        after: createAuthMiddleware(async (ctx) => {
            if (ctx.path !== "/get-session") return;
            const returned = ctx.context.returned as {
                session?: { userId?: string; impersonatedBy?: string | null };
            } | null;
            const session = returned?.session;
            if (!session?.userId || session.impersonatedBy) return;
            await ctx.context.runInBackgroundOrAwait(
                recordActivity(session.userId),
            );
        }),
    },
    // Sign-ups, sign-ins, and sign-outs are recorded for the admin analytics
    // page (src/server/analytics.ts); impersonation sessions aren't.
    databaseHooks: {
        user: {
            create: {
                after: async (user, context) => {
                    await recordAuthEvent(
                        user.id,
                        "sign-up",
                        signInMethod(context),
                    );
                },
            },
        },
        session: {
            create: {
                // Start each session in the user's earliest current school
                // (former-student memberships last), so school-scoped pages
                // work without picking one first.
                before: async (session) => {
                    const [first] = await schoolsOf(session.userId, {
                        includeFormer: true,
                    }).limit(1);
                    return {
                        data: {
                            ...session,
                            activeOrganizationId: first?.id ?? null,
                        },
                    };
                },
                after: async (session, context) => {
                    if (session.impersonatedBy) return;
                    await recordAuthEvent(
                        session.userId,
                        "sign-in",
                        signInMethod(context),
                    );
                },
            },
            delete: {
                // Only real sign-outs; sessions also end by expiring, being
                // revoked, or the user being banned.
                after: async (session, context) => {
                    if (context?.path !== "/sign-out") return;
                    if (session.impersonatedBy) return;
                    await recordAuthEvent(session.userId, "sign-out");
                },
            },
        },
    },
    // Passwords for username accounts (and the dev accounts, see
    // src/lib/auth/dev-login.ts). Signing in by email is refused above.
    // Accounts are created without a session; the browser then signs in by
    // username, so cookies and the sign-in event are recorded as usual.
    emailAndPassword: {
        enabled: true,
        autoSignIn: false,
        minPasswordLength: PASSWORD_MIN_LENGTH,
        maxPasswordLength: PASSWORD_MAX_LENGTH,
    },
    // Only the providers configured in the env (src/server/oauth.ts); the
    // others have no endpoints and no button on the sign-in page.
    socialProviders: {
        ...(oauth.google && {
            google: { prompt: "select_account", ...oauth.google },
        }),
        ...(oauth.github && { github: oauth.github }),
        ...(oauth.microsoft && {
            microsoft: { prompt: "select_account", ...oauth.microsoft },
        }),
    },
    user: {
        modelName: "uil_user",
        additionalFields: {
            showSubmissionScores: {
                type: "boolean",
                required: true,
                defaultValue: true,
            },

            role: {
                type: "string",
                required: true,
                defaultValue: "student",
                // Never settable at sign-up, or anyone could make
                // themselves a teacher.
                input: false,
            },
            showScoresInLeaderboard: {
                type: "boolean",
                required: true,
                defaultValue: true,
            },
            showInGlobalLeaderboard: {
                type: "boolean",
                required: true,
                defaultValue: false,
                input: false,
            },
        },
    },
    session: {
        modelName: "uil_session",
    },
    account: {
        modelName: "uil_account",
    },
    verification: {
        modelName: "uil_verification",
    },
});
