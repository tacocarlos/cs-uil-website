import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { env } from "~/env";
import { db } from "~/server/db";
import * as authSchema from "~/server/db/schema/auth";

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
        },
    }),
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
            },
            showScoresInLeaderboard: {
                type: "boolean",
                required: true,
                defaultValue: true,
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
