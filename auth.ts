import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { env } from "~/env";
import { db } from "~/server/db";
import * as authSchema from "~/server/db/schema/auth";
export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            ...authSchema,
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
        additionalFields: {
            showSubmissionScores: {
                type: "boolean",
                required: true,
                defaultValue: true,
            },

            mostRecentProblem: {
                type: "number",
                required: true,
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
});
