import z from "zod";
import { TRPCError } from "@trpc/server";
import {
    createTRPCRouter,
    protectedProcedure,
    teacherProcedure,
} from "../trpc";
import { db } from "~/server/db";
import { submission } from "~/server/db/schema/submission";
import { user as userTable } from "~/server/db/schema/auth";
import { and, desc, eq, sql } from "drizzle-orm";
import { inSchool } from "~/server/organizations";

// Student procedures return the signed-in user's own submissions only;
// teacher procedures see and change only their school's students'.
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

    /**
     * The 10 latest submissions by the teacher's students, for the
     * dashboard. Former students are left out unless `includeFormer`.
     */
    getRecentOrgSubmission: teacherProcedure
        .input(z.object({ includeFormer: z.boolean().default(false) }))
        .query(({ ctx, input }) =>
            db
                .select({
                    id: submission.id,
                    problemId: submission.problemId,
                    userId: submission.userId,
                    timeSubmitted: submission.timeSubmitted,
                    points: submission.points,
                    maxPoints: submission.maxPoints,
                    accepted: submission.accepted,
                    userName: userTable.name,
                    userEmail: userTable.email,
                    attemptNum: submission.attemptNumber,
                })
                .from(submission)
                .leftJoin(userTable, eq(submission.userId, userTable.id))
                // Checks membership in this school only, so students in
                // several schools aren't duplicated or misjudged.
                .where(
                    inSchool(submission.userId, ctx.organizationId, {
                        currentOnly: !input.includeFormer,
                    }),
                )
                .orderBy(desc(submission.timeSubmitted))
                .limit(10),
        ),

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

    overrideSubmission: teacherProcedure
        .input(
            z.object({
                submissionId: z.string(),
                accepted: z.boolean(),
                points: z.number().int().min(0),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { submissionId, accepted, points } = input;
            const rows = await db
                .update(submission)
                .set({ accepted, points })
                .where(
                    and(
                        eq(submission.id, submissionId),
                        inSchool(submission.userId, ctx.organizationId),
                    ),
                )
                .returning();
            if (rows.length === 0) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Submission not found",
                });
            }
            return rows[0]!;
        }),
});
