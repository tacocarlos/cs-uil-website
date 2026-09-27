import z from "zod";
import { and, eq } from "drizzle-orm";
import { publicProcedure } from "../../trpc";
import { db } from "~/server/db";
import {
    contest,
    contestEnrollment,
    contestProblem,
    contestSubmission,
} from "~/server/db/schema/contest";
import { gradeSubmission } from "~/lib/problems/judge/grade-submission";
import { contestPoints, pickBestPerProblem } from "~/lib/contest/scoring";

const contestAndUser = z.object({
    contestId: z.number().int(),
    userId: z.string(),
});

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

/** What a student does in a contest: enroll, submit, and check progress. */
export const contestParticipation = {
    isEnrolled: publicProcedure
        .input(contestAndUser)
        .query(async ({ input }) => {
            const rows = await findEnrollment(input.contestId, input.userId);
            return rows.length > 0;
        }),

    enroll: publicProcedure
        .input(contestAndUser)
        .mutation(async ({ input }) => {
            const existing = await findEnrollment(
                input.contestId,
                input.userId,
            );
            if (existing.length > 0) {
                throw new Error("Already enrolled in this contest");
            }
            const [row] = await db
                .insert(contestEnrollment)
                .values(input)
                .returning();
            return row;
        }),

    getMyBestPerProblem: publicProcedure
        .input(contestAndUser)
        .query(async ({ input }) => {
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
                        eq(contestSubmission.userId, input.userId),
                    ),
                );
            return pickBestPerProblem(submissions);
        }),

    submitCode: publicProcedure
        .input(
            contestAndUser.extend({
                apiProblemId: z.number().int(),
                code: z.string(),
                languageId: z.string(),
            }),
        )
        .mutation(async ({ input }) => {
            const { contestId, apiProblemId, userId, code, languageId } = input;

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
