import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { env } from "~/env";
import { devLoginEnabled } from "~/lib/auth/dev-login";
import { DEFAULT_ORGANIZATION } from "~/lib/auth/organizations";
import { db } from "~/server/db";
import * as authSchema from "~/server/db/schema/auth";
import * as orgSchema from "~/server/db/schema/organization";

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
            // Schools are set up by site admins, not self-serve.
            allowUserToCreateOrganization: (user) => user.role === "site-admin",
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
    ],
    databaseHooks: {
        user: {
            create: {
                // Until students can join a school with a code, everyone
                // joins the default school.
                after: async (user) => {
                    await db
                        .insert(orgSchema.member)
                        .values({
                            id: randomUUID(),
                            organizationId: DEFAULT_ORGANIZATION.id,
                            userId: user.id,
                            role: "member",
                            createdAt: new Date(),
                        })
                        .onConflictDoNothing();
                },
            },
        },
        session: {
            create: {
                // Start each session in the user's earliest school, so
                // school-scoped pages work without picking one first.
                before: async (session) => {
                    const [first] = await db
                        .select({ id: orgSchema.member.organizationId })
                        .from(orgSchema.member)
                        .where(eq(orgSchema.member.userId, session.userId))
                        .orderBy(asc(orgSchema.member.createdAt))
                        .limit(1);
                    return {
                        data: {
                            ...session,
                            activeOrganizationId: first?.id ?? null,
                        },
                    };
                },
            },
        },
    },
    // Only for the fake dev accounts (see src/lib/auth/dev-login.ts);
    // everyone else signs in with Google.
    emailAndPassword: { enabled: devLoginEnabled() },
    socialProviders: {
        google: {
            prompt: "select_account",
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
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
