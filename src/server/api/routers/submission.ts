import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { db } from "~/server/db";
import { submission } from "~/server/db/schema/submission";
import { and, desc, eq, sql } from "drizzle-orm";

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

    getAcceptedSubmissions: publicProcedure
        .input(z.object({ userId: z.string() }))
        .query(async (opts) => {
            const { userId } = opts.input;
            return db
                .select()
                .from(submission)
                .orderBy(desc(submission.timeSubmitted))
                .where(
                    and(
                        eq(submission.userId, userId),
                        eq(submission.accepted, true),
                    ),
                );
        }),

    getDeniedSubmissions: publicProcedure
        .input(z.object({ userId: z.string() }))
        .query(async (opts) => {
            const { userId } = opts.input;
            // Subquery to get the latest timeSubmitted for each problem+user combo
            const subquery = db
                .select({
                    problemId: submission.problemId,
                    userId: submission.userId,
                    latestTime: sql`max(${submission.timeSubmitted})`.as(
                        "latestTime",
                    ),
                })
                .from(submission)
                .where(
                    and(
                        eq(submission.accepted, false),
                        eq(submission.userId, userId),
                    ),
                )
                .groupBy(submission.problemId, submission.userId)
                .as("latest_per_problem_user");

            return await db
                .select()
                .from(submission)
                .innerJoin(
                    subquery,
                    and(
                        eq(submission.problemId, subquery.problemId),
                        eq(submission.userId, subquery.userId),
                        eq(submission.timeSubmitted, subquery.latestTime),
                    ),
                )
                .where(eq(submission.accepted, false));
        }),

    getMostRecentSubmission: publicProcedure
        .input(z.object({ userId: z.string(), problemId: z.number().int() }))
        .query(async (opts) => {
            const { userId, problemId } = opts.input;
            if (userId === "") return undefined;
            const mostRecent = (
                await db
                    .select()
                    .from(submission)
                    .orderBy(
                        desc(submission.accepted),
                        desc(submission.timeSubmitted),
                    )
                    .where(
                        and(
                            eq(submission.userId, userId),
                            eq(submission.problemId, problemId),
                        ),
                    )
                    .limit(1)
            ).at(0);

            if (mostRecent !== undefined) {
                return { state: "success" as const, mostRecent };
            } else {
                return { state: "failed" as const };
            }
        }),
});
