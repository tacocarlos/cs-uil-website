import { z } from "zod";
import { db } from "~/server/db";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { eq, and } from "drizzle-orm";
import { diffChars } from "diff";
import { submission } from "~/server/db/schema/submission";
import { user as userTable } from "~/server/db/schema/auth";
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
    getJudge0Status: publicProcedure.query(() => fetchJudge0Status()),

    getLanguages: publicProcedure.query(() => fetchJudge0Languages()),

    runCode: publicProcedure
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

    submitCode: publicProcedure
        .input(
            z.object({
                problemId: z.number(),
                userID: z.string(),
                code: z.string(),
                languageId: z.string(),
            }),
        )
        .output(
            z.object({
                accepted: z.boolean(),
                attemptNumber: z.number(),
                score: z.number(),
                diff: z.string(),
                distance: z.number(),
                executionResult: judge0ResultSchema,
            }),
        )
        .mutation(async (opts) => {
            const { userID, problemId, code, languageId } = opts.input;

            const [user, prevSubmissions] = await Promise.all([
                db
                    .select()
                    .from(userTable)
                    .where(eq(userTable.id, userID))
                    .limit(1)
                    .then((rows) => rows[0]),
                db
                    .select()
                    .from(submission)
                    .where(
                        and(
                            eq(submission.userId, userID),
                            eq(submission.problemId, problemId),
                        ),
                    ),
            ]);

            const numSubmissions = prevSubmissions.length + 1;

            const graded = await gradeSubmission(problemId, code, languageId);
            const diff = diffStrings(graded.actual, graded.expected);
            const score = graded.accepted ? CalculateScore(numSubmissions) : 0;
            const alreadySucceeded = prevSubmissions.some((ps) => ps.accepted);

            if (!alreadySucceeded) {
                await db.insert(submission).values({
                    problemId: graded.problem.id,
                    userId: userID,
                    maxPoints: 60,
                    points: score,
                    accepted: graded.accepted,
                    isStudentVisible: user?.showSubmissionScores ?? false,
                    submittedCode: code,
                    attemptNumber: numSubmissions,
                });
            }

            console.dir({
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
                diff,
                distance: graded.distance,
                executionResult: graded.result,
            };
        }),
});
export type AppRouter = typeof executeRouter;
