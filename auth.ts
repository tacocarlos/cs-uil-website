import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { env } from "~/env";
import { db } from "~/server/db";
import * as authSchema from "~/server/db/schema/auth";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        // Keys must match the modelName configured for each model below so
        // Better Auth can resolve the correct Drizzle table object at runtime.
        schema: {
            "cs-uil-website_user": authSchema.user,
            "cs-uil-website_session": authSchema.session,
            "cs-uil-website_account": authSchema.account,
            "cs-uil-website_verification": authSchema.verification,
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
        modelName: "cs-uil-website_user",
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
        modelName: "cs-uil-website_session",
    },
    account: {
        modelName: "cs-uil-website_account",
    },
    verification: {
        modelName: "cs-uil-website_verification",
    },
});
