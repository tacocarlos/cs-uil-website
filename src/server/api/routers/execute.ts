import { z } from "zod";
import { db } from "~/server/db";
import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
    teacherProcedure,
} from "~/server/api/trpc";
import { eq, and } from "drizzle-orm";
import { diffChars } from "diff";
import { submission } from "~/server/db/schema/submission";
import CalculateScore from "~/lib/problems/judge/calculate-score";
import { gradeSubmission } from "~/lib/problems/judge/grade-submission";
import {
    fetchJudge0Languages,
    fetchJudge0Status,
    judge0ResultSchema,
    runOnJudge0,
} from "~/lib/problems/execute/judge0";

function diffStrings(a: string, b: string): string {
    const changes: Array<{
        added?: boolean;
        removed?: boolean;
        value: string;
    }> = diffChars(a, b);

    return changes
        .map((part) => {
            if (part.added) return `{+${part.value}+}`;
            if (part.removed) return `[-${part.value}-]`;
            return part.value; // unchanged
        })
        .join("");
}

export const executeRouter = createTRPCRouter({
    getJudge0Status: teacherProcedure.query(() => fetchJudge0Status()),

    getLanguages: publicProcedure.query(() => fetchJudge0Languages()),

    // Signed-in only: runs cost Judge0 capacity.
    runCode: protectedProcedure
        .input(
            z.object({
                code: z.string(),
                input: z.string(),
                languageId: z.string(),
            }),
        )
        .output(judge0ResultSchema)
        .mutation(({ input }) =>
            runOnJudge0(input.code, input.languageId, input.input),
        ),

    submitCode: protectedProcedure
        .input(
            z.object({
                problemId: z.number(),
                code: z.string(),
                languageId: z.string(),
            }),
        )
        .output(
            z.object({
                accepted: z.boolean(),
                attemptNumber: z.number(),
                score: z.number(),
                // No diff or distance: both reveal the hidden expected output.
                executionResult: judge0ResultSchema,
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { problemId, code, languageId } = input;
            const userId = ctx.user.id;

            const prevSubmissions = await db
                .select()
                .from(submission)
                .where(
                    and(
                        eq(submission.userId, userId),
                        eq(submission.problemId, problemId),
                    ),
                );

            const numSubmissions = prevSubmissions.length + 1;

            const graded = await gradeSubmission(problemId, code, languageId);
            const diff = diffStrings(graded.actual, graded.expected);
            const score = graded.accepted ? CalculateScore(numSubmissions) : 0;
            const alreadySucceeded = prevSubmissions.some((ps) => ps.accepted);

            if (!alreadySucceeded) {
                await db.insert(submission).values({
                    problemId: graded.problem.id,
                    userId,
                    maxPoints: 60,
                    points: score,
                    accepted: graded.accepted,
                    isStudentVisible: ctx.user.showSubmissionScores,
                    submittedCode: code,
                    attemptNumber: numSubmissions,
                });
            }

            // Server log only; the expected output must not reach students.
            console.dir({
                userId,
                problemId,
                accepted: graded.accepted,
                distance: graded.distance,
                diff,
                output: graded.actual,
                expected: graded.expected,
                compileOutput: graded.result.compile_output,
            });

            return {
                accepted: graded.accepted,
                attemptNumber: numSubmissions,
                score,
                executionResult: graded.result,
            };
        }),
});
export type AppRouter = typeof executeRouter;
