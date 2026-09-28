import z from "zod";
import { asc, desc, eq, sql } from "drizzle-orm";
import {
    protectedProcedure,
    publicProcedure,
    teacherProcedure,
} from "../../trpc";
import { db } from "~/server/db";
import {
    contest,
    contestEnrollment,
    contestProblem,
    contestSubmission,
} from "~/server/db/schema/contest";
import { user } from "~/server/db/schema/auth";
import { buildLeaderboard } from "~/lib/contest/leaderboard";

const byContest = z.object({ contestId: z.number().int() });

/** Read-only contest data: listings, details, enrollments, results. */
export const contestQueries = {
    getAll: publicProcedure.query(() =>
        db
            .select({
                id: contest.id,
                name: contest.name,
                description: contest.description,
                startsAt: contest.startsAt,
                endsAt: contest.endsAt,
                status: contest.status,
                scoringMode: contest.scoringMode,
                penaltyPoints: contest.penaltyPoints,
                createdAt: contest.createdAt,
                problemCount: sql<number>`count(distinct ${contestProblem.id})::int`,
                participantCount: sql<number>`count(distinct ${contestEnrollment.id})::int`,
            })
            .from(contest)
            .leftJoin(contestProblem, eq(contestProblem.contestId, contest.id))
            .leftJoin(
                contestEnrollment,
                eq(contestEnrollment.contestId, contest.id),
            )
            .groupBy(contest.id)
            .orderBy(desc(contest.createdAt)),
    ),

    getById: publicProcedure.input(byContest).query(async ({ input }) => {
        const [[row], problems, [enrollments]] = await Promise.all([
            db
                .select()
                .from(contest)
                .where(eq(contest.id, input.contestId))
                .limit(1),
            db
                .select()
                .from(contestProblem)
                .where(eq(contestProblem.contestId, input.contestId))
                .orderBy(asc(contestProblem.displayOrder)),
            db
                .select({ count: sql<number>`count(*)::int` })
                .from(contestEnrollment)
                .where(eq(contestEnrollment.contestId, input.contestId)),
        ]);

        if (!row) return null;
        return {
            ...row,
            problems,
            participantCount: enrollments?.count ?? 0,
        };
    }),

    // Names and emails: teachers only.
    getEnrollments: teacherProcedure.input(byContest).query(({ input }) =>
        db
            .select({
                id: contestEnrollment.id,
                userId: contestEnrollment.userId,
                userName: user.name,
                userEmail: user.email,
                enrolledAt: contestEnrollment.enrolledAt,
            })
            .from(contestEnrollment)
            .innerJoin(user, eq(contestEnrollment.userId, user.id))
            .where(eq(contestEnrollment.contestId, input.contestId))
            .orderBy(asc(contestEnrollment.enrolledAt)),
    ),

    // Every student's submissions: teachers only.
    getAllSubmissions: teacherProcedure
        .input(
            byContest.extend({
                limit: z.number().int().min(1).max(200).optional(),
                offset: z.number().int().min(0).optional(),
            }),
        )
        .query(({ input }) =>
            db
                .select({
                    id: contestSubmission.id,
                    apiProblemId: contestSubmission.apiProblemId,
                    userId: contestSubmission.userId,
                    userName: user.name,
                    accepted: contestSubmission.accepted,
                    points: contestSubmission.points,
                    attemptNumber: contestSubmission.attemptNumber,
                    submittedAt: contestSubmission.submittedAt,
                })
                .from(contestSubmission)
                .innerJoin(user, eq(contestSubmission.userId, user.id))
                .where(eq(contestSubmission.contestId, input.contestId))
                .orderBy(desc(contestSubmission.submittedAt))
                .limit(input.limit ?? 50)
                .offset(input.offset ?? 0),
        ),

    // Shows students' names, so signed-in users only.
    getLeaderboard: protectedProcedure
        .input(byContest)
        .query(async ({ input }) => {
            const [submissions, problems] = await Promise.all([
                db
                    .select({
                        userId: contestSubmission.userId,
                        userName: user.name,
                        apiProblemId: contestSubmission.apiProblemId,
                        accepted: contestSubmission.accepted,
                        points: contestSubmission.points,
                        submittedAt: contestSubmission.submittedAt,
                    })
                    .from(contestSubmission)
                    .innerJoin(user, eq(contestSubmission.userId, user.id))
                    .where(eq(contestSubmission.contestId, input.contestId))
                    .orderBy(asc(contestSubmission.submittedAt)),
                db
                    .select({
                        apiProblemId: contestProblem.apiProblemId,
                        label: contestProblem.label,
                    })
                    .from(contestProblem)
                    .where(eq(contestProblem.contestId, input.contestId)),
            ]);

            const labels = new Map(
                problems.map((p) => [p.apiProblemId, p.label]),
            );
            return buildLeaderboard(submissions, labels);
        }),
};
