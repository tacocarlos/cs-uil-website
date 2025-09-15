import { env } from "~/env";
import { z } from "zod";
import { db } from "~/server/db";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { problems } from "~/server/db/schema/problem";
import { eq, and } from "drizzle-orm";
import { distance } from "fastest-levenshtein";
import { diffChars } from "diff";
import { submission } from "~/server/db/schema/submission";
import { user as userTable } from "~/server/db/schema/auth";

async function executeCode(
    code: string,
    language_id: string,
    stdin: string = "",
): Promise<{
    stdout: string | null;
    stderr: string | null;
    time: string;
    memory: number;
    token: string;
    compile_output: string | null;
    status: {
        id: number;
        description: string;
    };
}> {
    // 1.) Request Judge0 to start running the code, waiting for it to finish
    const reqBody = JSON.stringify({
        source_code: code,
        language_id,
        stdin,
    });

    const submissionRequest = await fetch(
        "http://judge0.lunaghs.dev/submissions?wait=true",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: reqBody,
        },
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const submissionToken = (await submissionRequest.json()).token;
    const submissionResponse = await fetch(
        `http://judge0.lunaghs.dev/submissions/${submissionToken}`,
        {
            method: "GET",
        },
    );
    return submissionResponse.json();
}

function diffStrings(a: string, b: string): string {
    const changes = diffChars(a, b);

    return changes
        .map((part) => {
            if (part.added) return `{+${part.value}+}`;
            if (part.removed) return `[-${part.value}-]`;
            return part.value; // unchanged
        })
        .join("");
}

export const executeRouter = createTRPCRouter({
    getJavaRuntimes: publicProcedure.query(async () => {
        type ResponseData = [{ name: string; id: string }];
        const url = new URL("/languages", env.JUDGE_URL);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const languages: ResponseData = (await response.json()) as ResponseData;
        const javaJREs = languages.filter((l) => {
            if (l.name.includes("OpenJDK")) {
                return true;
            }

            return false;
        });

        return javaJREs;
    }),

    runCode: publicProcedure
        .input(
            z.object({
                code: z.string(),
                input: z.string(),
                languageId: z.string(),
            }),
        )
        .output(
            z.object({
                stdout: z.string().nullable(),
                stderr: z.string().nullable(),
                time: z.string(),
                memory: z.number(),
                token: z.string(),
                compile_output: z.string().nullable(),
                status: z.object({
                    id: z.number(),
                    description: z.string(),
                }),
            }),
        )
        .mutation(async (opts) => {
            const { code, input, languageId } = opts.input;
            return executeCode(code, languageId, input);
        }),

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
                executionResult: z.object({
                    stdout: z.string().nullable(),
                    stderr: z.string().nullable(),
                    time: z.string(),
                    memory: z.number(),
                    token: z.string(),
                    compile_output: z.string().nullable(),
                    status: z.object({
                        id: z.number(),
                        description: z.string(),
                    }),
                }),
            }),
        )
        .mutation(async (opts) => {
            const { userID, problemId, code, languageId } = opts.input;
            const user = (
                await db
                    .select()
                    .from(userTable)
                    .where(eq(userTable.id, userID))
                    .limit(1)
            )[0];
            let problemQuery = await db
                .select()
                .from(problems)
                .where(eq(problems.id, problemId))
                .limit(1);
            if (problemQuery.length === 0) {
                throw Error("Failed to read problem");
            }

            const prevSubmissions = await db
                .select()
                .from(submission)
                .where(
                    and(
                        eq(submission.userId, userID),
                        eq(submission.problemId, problemId),
                    ),
                );

            const numSubmissions = prevSubmissions.length + 1;

            const problem = problemQuery[0];
            const executionResult = await executeCode(
                code,
                languageId,
                problem?.testInput ?? "",
            );

            const score = 60 - (numSubmissions - 1);
            const diff = diffStrings(
                executionResult.stdout ?? "",
                problem?.testOutput ?? "",
            );
            const dist = distance(
                executionResult.stdout ?? "",
                problem?.testOutput ?? "",
            );
            const accepted = dist < 10;

            const alreadySucceeded =
                prevSubmissions.find((ps) => ps.accepted) !== undefined;

            if (!alreadySucceeded) {
                await db.update(submission).set({
                    problemId: problem?.id,
                    userId: userID,
                    maxPoints: 60,
                    points: score,
                    accepted: dist < 10,
                    isStudentVisible: user?.showSubmissionScores,
                });
            }

            return {
                accepted,
                attemptNumber: numSubmissions,
                score,
                diff,
                distance: dist,
                executionResult: executionResult,
            };
        }),
});
export type AppRouter = typeof executeRouter;
