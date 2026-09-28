import z from "zod";
import {
    createTRPCRouter,
    protectedProcedure,
    teacherProcedure,
} from "../trpc";
import { db } from "~/server/db";
import { submission } from "~/server/db/schema/submission";
import { user as userTable } from "~/server/db/schema/auth";
import { and, desc, eq, sql } from "drizzle-orm";

// Student procedures return the signed-in user's own submissions only;
// teacher procedures can see everyone's.
export const submissionRouter = createTRPCRouter({
    getProblemSubmissions: protectedProcedure
        .input(z.object({ problemId: z.number() }))
        .query(async ({ ctx, input }) => {
            const { problemId } = input;
            const userId = ctx.user.id;
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

    getAcceptedSubmissions: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.user.id;
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

    getDeniedSubmissions: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.user.id;
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

    getMostRecentSubmission: protectedProcedure
        .input(z.object({ problemId: z.number().int() }))
        .query(async ({ ctx, input }) => {
            const { problemId } = input;
            const userId = ctx.user.id;
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

    getAllSubmissions: teacherProcedure
        .input(
            z.object({
                limit: z.number().int().min(1).max(100).default(50),
                offset: z.number().int().min(0).default(0),
            }),
        )
        .query(async (opts) => {
            const { limit, offset } = opts.input;
            return await db
                .select({
                    id: submission.id,
                    problemId: submission.problemId,
                    userId: submission.userId,
                    timeSubmitted: submission.timeSubmitted,
                    points: submission.points,
                    maxPoints: submission.maxPoints,
                    accepted: submission.accepted,
                    isStudentVisible: submission.isStudentVisible,
                    userName: userTable.name,
                    userEmail: userTable.email,
                    userImage: userTable.image,
                })
                .from(submission)
                .leftJoin(userTable, eq(submission.userId, userTable.id))
                .orderBy(desc(submission.timeSubmitted))
                .limit(limit)
                .offset(offset);
        }),

    getSubmissionById: teacherProcedure
        .input(z.object({ submissionId: z.string() }))
        .query(async (opts) => {
            const { submissionId } = opts.input;
            const rows = await db
                .select({
                    id: submission.id,
                    problemId: submission.problemId,
                    userId: submission.userId,
                    timeSubmitted: submission.timeSubmitted,
                    points: submission.points,
                    maxPoints: submission.maxPoints,
                    accepted: submission.accepted,
                    isStudentVisible: submission.isStudentVisible,
                    submittedCode: submission.submittedCode,
                    userName: userTable.name,
                    userEmail: userTable.email,
                    userImage: userTable.image,
                })
                .from(submission)
                .leftJoin(userTable, eq(submission.userId, userTable.id))
                .where(eq(submission.id, submissionId))
                .limit(1);
            return rows.at(0) ?? null;
        }),

    overrideSubmission: teacherProcedure
        .input(
            z.object({
                submissionId: z.string(),
                accepted: z.boolean(),
                points: z.number().int().min(0),
            }),
        )
        .mutation(async (opts) => {
            const { submissionId, accepted, points } = opts.input;
            const rows = await db
                .update(submission)
                .set({ accepted, points })
                .where(eq(submission.id, submissionId))
                .returning();
            if (rows.length === 0) {
                throw new Error("Submission not found");
            }
            return rows[0]!;
        }),
});
