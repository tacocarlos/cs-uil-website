import z from "zod";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../trpc";
import { db } from "~/server/db";
import {
    contest,
    contestEnrollment,
    contestProblem,
    contestSubmission,
} from "~/server/db/schema/contest";
import {
    findVisibleContest,
    invitedSchoolIds,
    pickCompetingSchool,
    schoolIdsOf,
} from "~/server/contests";
import { gradeSubmission } from "~/lib/problems/judge/grade-submission";
import { contestPoints, pickBestPerProblem } from "~/lib/contest/scoring";

const byContest = z.object({ contestId: z.number().int() });

/** Contest statuses in which students may enroll. */
const ENROLLABLE_STATUSES = new Set(["scheduled", "active"]);

function findEnrollment(contestId: number, userId: string) {
    return db
        .select({ id: contestEnrollment.id })
        .from(contestEnrollment)
        .where(
            and(
                eq(contestEnrollment.contestId, contestId),
                eq(contestEnrollment.userId, userId),
            ),
        )
        .limit(1);
}

/**
 * What a student does in a contest: enroll, submit, and check progress.
 * Always acts as the signed-in user.
 */
export const contestParticipation = {
    isEnrolled: protectedProcedure
        .input(byContest)
        .query(async ({ ctx, input }) => {
            const rows = await findEnrollment(input.contestId, ctx.user.id);
            return rows.length > 0;
        }),

    /** Enrolls the student, recording which school they compete for. */
    enroll: protectedProcedure
        .input(byContest)
        .mutation(async ({ ctx, input }) => {
            const contestRow = await findVisibleContest(
                input.contestId,
                ctx.user.id,
            );
            if (!contestRow) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Contest not found",
                });
            }
            if (!ENROLLABLE_STATUSES.has(contestRow.status)) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "This contest isn't open for enrollment",
                });
            }

            const existing = await findEnrollment(input.contestId, ctx.user.id);
            if (existing.length > 0) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Already enrolled in this contest",
                });
            }

            const [schools, invited, membership] = await Promise.all([
                schoolIdsOf(ctx.user.id),
                contestRow.visibility === "invite"
                    ? invitedSchoolIds(contestRow.id)
                    : [],
                ctx.getActiveMembership(),
            ]);
            const school = pickCompetingSchool(
                { ...contestRow, invited },
                schools,
                membership?.organizationId ?? null,
            );
            // Unreachable while seeing a contest implies eligibility, but
            // kept so enrollment never depends on that staying true.
            if (school === undefined) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Your school isn't taking part in this contest",
                });
            }

            const [row] = await db
                .insert(contestEnrollment)
                .values({
                    contestId: input.contestId,
                    userId: ctx.user.id,
                    organizationId: school,
                })
                .returning();
            return row;
        }),

    getMyBestPerProblem: protectedProcedure
        .input(byContest)
        .query(async ({ ctx, input }) => {
            const submissions = await db
                .select({
                    apiProblemId: contestSubmission.apiProblemId,
                    accepted: contestSubmission.accepted,
                    points: contestSubmission.points,
                    attemptNumber: contestSubmission.attemptNumber,
                })
                .from(contestSubmission)
                .where(
                    and(
                        eq(contestSubmission.contestId, input.contestId),
                        eq(contestSubmission.userId, ctx.user.id),
                    ),
                );
            return pickBestPerProblem(submissions);
        }),

    submitCode: protectedProcedure
        .input(
            byContest.extend({
                apiProblemId: z.number().int(),
                code: z.string(),
                languageId: z.string(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { contestId, apiProblemId, code, languageId } = input;
            const userId = ctx.user.id;

            if ((await findEnrollment(contestId, userId)).length === 0) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Enroll in this contest before submitting",
                });
            }

            const [[contestRow], [problem], priorSubmissions] =
                await Promise.all([
                    db
                        .select()
                        .from(contest)
                        .where(eq(contest.id, contestId))
                        .limit(1),
                    db
                        .select({ maxPoints: contestProblem.maxPoints })
                        .from(contestProblem)
                        .where(
                            and(
                                eq(contestProblem.contestId, contestId),
                                eq(contestProblem.apiProblemId, apiProblemId),
                            ),
                        )
                        .limit(1),
                    db
                        .select({ accepted: contestSubmission.accepted })
                        .from(contestSubmission)
                        .where(
                            and(
                                eq(contestSubmission.contestId, contestId),
                                eq(
                                    contestSubmission.apiProblemId,
                                    apiProblemId,
                                ),
                                eq(contestSubmission.userId, userId),
                            ),
                        ),
                ]);

            if (!contestRow) throw new Error(`Contest ${contestId} not found`);
            if (contestRow.status !== "active") {
                throw new Error("Contest is not active");
            }
            if (!problem) {
                throw new Error(
                    `Problem ${apiProblemId} is not part of contest ${contestId}`,
                );
            }

            const { accepted, result } = await gradeSubmission(
                apiProblemId,
                code,
                languageId,
            );

            const attemptNumber = priorSubmissions.length + 1;
            const points = contestPoints({
                accepted,
                maxPoints: problem.maxPoints,
                scoringMode: contestRow.scoringMode,
                penaltyPoints: contestRow.penaltyPoints,
                wrongAttempts: priorSubmissions.filter((s) => !s.accepted)
                    .length,
            });

            // Once a problem is accepted, later submissions are graded but
            // not recorded, so they can't change the score.
            const alreadyAccepted = priorSubmissions.some((s) => s.accepted);
            if (!alreadyAccepted) {
                await db.insert(contestSubmission).values({
                    contestId,
                    apiProblemId,
                    userId,
                    languageId,
                    submittedCode: code,
                    accepted,
                    points,
                    attemptNumber,
                });
            }

            return {
                accepted,
                points,
                attemptNumber,
                stdout: result.stdout,
                stderr: result.stderr,
                compileOutput: result.compile_output,
                status: result.status,
            };
        }),
};
