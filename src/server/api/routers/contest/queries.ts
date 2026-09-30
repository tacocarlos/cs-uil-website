import z from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm";
import {
    protectedProcedure,
    publicProcedure,
    teacherProcedure,
} from "../../trpc";
import { db } from "~/server/db";
import {
    contest,
    contestEnrollment,
    contestInvite,
    contestProblem,
    contestSubmission,
} from "~/server/db/schema/contest";
import { user } from "~/server/db/schema/auth";
import { organization } from "~/server/db/schema/organization";
import { buildLeaderboard } from "~/lib/contest/leaderboard";
import {
    findVisibleContest,
    requireHostedContest,
    visibleContests,
} from "~/server/contests";

const byContest = z.object({ contestId: z.number().int() });

/** Contest summaries (with host school and counts), newest first. */
function listContests(where: SQL) {
    return db
        .select({
            id: contest.id,
            name: contest.name,
            description: contest.description,
            startsAt: contest.startsAt,
            endsAt: contest.endsAt,
            status: contest.status,
            scoringMode: contest.scoringMode,
            penaltyPoints: contest.penaltyPoints,
            visibility: contest.visibility,
            hostSchool: organization.name,
            createdAt: contest.createdAt,
            problemCount: sql<number>`count(distinct ${contestProblem.id})::int`,
            participantCount: sql<number>`count(distinct ${contestEnrollment.id})::int`,
        })
        .from(contest)
        .innerJoin(organization, eq(contest.organizationId, organization.id))
        .leftJoin(contestProblem, eq(contestProblem.contestId, contest.id))
        .leftJoin(
            contestEnrollment,
            eq(contestEnrollment.contestId, contest.id),
        )
        .where(where)
        .groupBy(contest.id, organization.name)
        .orderBy(desc(contest.createdAt));
}

/**
 * Read-only contest data: listings, details, enrollments, results. Only
 * contests the caller may see (src/server/contests.ts); teacher views only
 * cover contests their school hosts.
 */
export const contestQueries = {
    getAll: publicProcedure.query(({ ctx }) =>
        listContests(visibleContests(ctx.session?.user.id ?? null)),
    ),

    /** Contests hosted by the teacher's school. */
    getMine: teacherProcedure.query(({ ctx }) =>
        listContests(eq(contest.organizationId, ctx.organizationId)),
    ),

    getById: publicProcedure.input(byContest).query(async ({ ctx, input }) => {
        const row = await findVisibleContest(
            input.contestId,
            ctx.session?.user.id ?? null,
        );
        if (!row) return null;

        const [problems, [enrollments], [host], invitedSchools] =
            await Promise.all([
                db
                    .select()
                    .from(contestProblem)
                    .where(eq(contestProblem.contestId, row.id))
                    .orderBy(asc(contestProblem.displayOrder)),
                db
                    .select({ count: sql<number>`count(*)::int` })
                    .from(contestEnrollment)
                    .where(eq(contestEnrollment.contestId, row.id)),
                db
                    .select({ name: organization.name })
                    .from(organization)
                    .where(eq(organization.id, row.organizationId)),
                db
                    .select({ id: organization.id, name: organization.name })
                    .from(contestInvite)
                    .innerJoin(
                        organization,
                        eq(contestInvite.organizationId, organization.id),
                    )
                    .where(eq(contestInvite.contestId, row.id))
                    .orderBy(asc(organization.name)),
            ]);

        return {
            ...row,
            hostSchool: host?.name ?? null,
            invitedSchools,
            problems,
            participantCount: enrollments?.count ?? 0,
        };
    }),

    // Names and emails: the host school's teachers only.
    getEnrollments: teacherProcedure
        .input(byContest)
        .query(async ({ ctx, input }) => {
            await requireHostedContest(input.contestId, ctx.organizationId);
            return db
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
                .orderBy(asc(contestEnrollment.enrolledAt));
        }),

    // Every participant's submissions: the host school's teachers only.
    getAllSubmissions: teacherProcedure
        .input(
            byContest.extend({
                limit: z.number().int().min(1).max(200).optional(),
                offset: z.number().int().min(0).optional(),
            }),
        )
        .query(async ({ ctx, input }) => {
            await requireHostedContest(input.contestId, ctx.organizationId);
            return db
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
                .offset(input.offset ?? 0);
        }),

    // Shows students' names and schools, so signed-in users who may see the
    // contest only.
    getLeaderboard: protectedProcedure
        .input(byContest)
        .query(async ({ ctx, input }) => {
            if (!(await findVisibleContest(input.contestId, ctx.user.id))) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Contest not found",
                });
            }

            const [submissions, problems] = await Promise.all([
                db
                    .select({
                        userId: contestSubmission.userId,
                        userName: user.name,
                        schoolName: organization.name,
                        apiProblemId: contestSubmission.apiProblemId,
                        accepted: contestSubmission.accepted,
                        points: contestSubmission.points,
                        submittedAt: contestSubmission.submittedAt,
                    })
                    .from(contestSubmission)
                    .innerJoin(user, eq(contestSubmission.userId, user.id))
                    .leftJoin(
                        contestEnrollment,
                        and(
                            eq(
                                contestEnrollment.contestId,
                                contestSubmission.contestId,
                            ),
                            eq(
                                contestEnrollment.userId,
                                contestSubmission.userId,
                            ),
                        ),
                    )
                    .leftJoin(
                        organization,
                        eq(contestEnrollment.organizationId, organization.id),
                    )
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
