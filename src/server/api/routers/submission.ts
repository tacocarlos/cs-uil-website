import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { db } from "~/server/db";
import { submission } from "~/server/db/schema/submission";
import { and, desc, eq } from "drizzle-orm";

const userProblemObject = z.object({
    problemId: z.number(),
    userId: z.string(),
});

export const submissionRouter = createTRPCRouter({
    getProblemSubmissions: publicProcedure
        .input(userProblemObject)
        .query(async (opts) => {
            const { problemId, userId } = opts.input;
            return await db
                .select()
                .from(submission)
                .orderBy(desc(submission.timeSubmitted))
                .where(
                    and(
                        eq(submission.userId, userId),
                        eq(submission.problemId, problemId),
                    ),
                );
        }),

    getMostRecentSubmission: publicProcedure
        .input(z.object({ userId: z.string() }))
        .query(async (opts) => {
            const { userId } = opts.input;
            if (userId === "") return undefined;
            return (
                await db
                    .select()
                    .from(submission)
                    .orderBy(desc(submission.timeSubmitted))
                    .where(eq(submission.userId, userId))
                    .limit(1)
            ).at(0);
        }),
});
