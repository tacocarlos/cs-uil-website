import z from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm";
import {
    contestManagerProcedure,
    protectedProcedure,
    publicProcedure,
    teacherProcedure,
    type createTRPCContext,
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
    canManageContest,
    canSeeProblems,
    contestManagerFor,
    findAccessibleContest,
    visibleContests,
} from "~/server/contests";

const byContest = z.object({ contestId: z.number().int() });

/** Contest summaries (with host school and counts), newest first. */
function listContests(where: SQL | undefined) {
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
            organizationId: contest.organizationId,
            /** Null for global contests, which have no host. */
            hostSchool: organization.name,
            createdAt: contest.createdAt,
            problemCount: sql<number>`count(distinct ${contestProblem.id})::int`,
            participantCount: sql<number>`count(distinct ${contestEnrollment.id})::int`,
        })
        .from(contest)
        .leftJoin(organization, eq(contest.organizationId, organization.id))
        .leftJoin(contestProblem, eq(contestProblem.contestId, contest.id))
        .leftJoin(
            contestEnrollment,
            eq(contestEnrollment.contestId, contest.id),
        )
        .where(where)
        .groupBy(contest.id, organization.name)
        .orderBy(desc(contest.createdAt));
}

/** The caller as a contest manager, or null (signed out, or a student). */
async function managerOf(ctx: Awaited<ReturnType<typeof createTRPCContext>>) {
    if (!ctx.session) return null;
    return contestManagerFor(ctx.session.user, await ctx.getActiveMembership());
}

/**
 * Read-only contest data: listings, details, submissions, results. Only
 * contests the caller may see or manage (src/server/contests.ts).
 */
export const contestQueries = {
    getAll: publicProcedure.query(({ ctx }) =>
        listContests(visibleContests(ctx.session?.user.id ?? null)),
    ),

    /**
     * Contests the caller manages: every contest for site admins, the
     * school's contests for teachers.
     */
    getManaged: contestManagerProcedure.query(({ ctx }) =>
        listContests(
            ctx.manager.siteAdmin
                ? undefined
                : eq(contest.organizationId, ctx.manager.organizationId!),
        ),
    ),

    /**
     * Contests other schools invited the teacher's school to, with the
     * school's response (`declinedAt`).
     */
    getInvitations: teacherProcedure.query(({ ctx }) =>
        db
            .select({
                contestId: contest.id,
                name: contest.name,
                status: contest.status,
                startsAt: contest.startsAt,
                endsAt: contest.endsAt,
                hostSchool: organization.name,
                declinedAt: contestInvite.declinedAt,
            })
            .from(contestInvite)
            .innerJoin(contest, eq(contestInvite.contestId, contest.id))
            .leftJoin(organization, eq(contest.organizationId, organization.id))
            .where(
                and(
                    eq(contestInvite.organizationId, ctx.organizationId),
                    eq(contest.visibility, "invite"),
                ),
            )
            .orderBy(desc(contest.startsAt)),
    ),

    getById: publicProcedure.input(byContest).query(async ({ ctx, input }) => {
        const manager = await managerOf(ctx);
        const row = await findAccessibleContest(
            input.contestId,
            ctx.session?.user.id ?? null,
            manager,
        );
        if (!row) return null;

        // Before the start, only people who manage the contest see which
        // problems it has.
        const problemsRevealed = canSeeProblems(row, manager);

        const [problems, [enrollments], [host], invitedSchools] =
            await Promise.all([
                problemsRevealed
                    ? db
                          .select()
                          .from(contestProblem)
                          .where(eq(contestProblem.contestId, row.id))
                          .orderBy(asc(contestProblem.displayOrder))
                    : [],
                db
                    .select({ count: sql<number>`count(*)::int` })
                    .from(contestEnrollment)
                    .where(eq(contestEnrollment.contestId, row.id)),
                row.organizationId
                    ? db
                          .select({ name: organization.name })
                          .from(organization)
                          .where(eq(organization.id, row.organizationId))
                    : [],
                db
                    .select({
                        id: organization.id,
                        name: organization.name,
                        declinedAt: contestInvite.declinedAt,
                    })
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
            problemsRevealed,
            canManage: canManageContest(row, manager),
            participantCount: enrollments?.count ?? 0,
        };
    }),

    /**
     * Submissions in a contest: all of them for those who manage it;
     * otherwise, for a teacher, only their own school's students (as
     * recorded at enrollment).
     */
    getAllSubmissions: contestManagerProcedure
        .input(
            byContest.extend({
                limit: z.number().int().min(1).max(200).optional(),
                offset: z.number().int().min(0).optional(),
            }),
        )
        .query(async ({ ctx, input }) => {
            const row = await findAccessibleContest(
                input.contestId,
                ctx.user.id,
                ctx.manager,
            );
            if (!row) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Contest not found",
                });
            }
            const ownStudentsOnly = !canManageContest(row, ctx.manager);

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
                .innerJoin(
                    contestEnrollment,
                    and(
                        eq(
                            contestEnrollment.contestId,
                            contestSubmission.contestId,
                        ),
                        eq(contestEnrollment.userId, contestSubmission.userId),
                    ),
                )
                .where(
                    and(
                        eq(contestSubmission.contestId, input.contestId),
                        ownStudentsOnly
                            ? eq(
                                  contestEnrollment.organizationId,
                                  ctx.manager.organizationId!,
                              )
                            : undefined,
                    ),
                )
                .orderBy(desc(contestSubmission.submittedAt))
                .limit(input.limit ?? 50)
                .offset(input.offset ?? 0);
        }),

    // Shows students' names and schools, so signed-in users who may see
    // (or manage) the contest only.
    getLeaderboard: protectedProcedure
        .input(byContest)
        .query(async ({ ctx, input }) => {
            const row = await findAccessibleContest(
                input.contestId,
                ctx.user.id,
                await managerOf(ctx),
            );
            if (!row) {
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
