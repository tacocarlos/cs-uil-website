import { z } from "zod";
import { db } from "~/server/db";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { eq, and } from "drizzle-orm";
import { distance } from "fastest-levenshtein";
import { diffChars } from "diff";
import { submission } from "~/server/db/schema/submission";
import { user as userTable } from "~/server/db/schema/auth";
import { getProblemById, fetchUrlContent } from "~/lib/api/lunaghs";
import CalculateScore from "~/lib/problems/judge/calculate-score";

const LEVENSHTEIN_DISTANCE_THRESHOLD = 5;

async function executeCode(
    code: string,
    language_id: string,
    stdin = "",
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return submissionResponse.json();
}

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
    /** Fetches live Judge0 status from /about, /workers, and /statistics.
     *  Runs server-side so the browser never hits Judge0 directly (avoids CORS). */
    getJudge0Status: publicProcedure.query(async () => {
        try {
            const [aboutRes, workersRes, statsRes] = await Promise.all([
                fetch("http://judge0.lunaghs.dev/about",      { cache: "no-store" }),
                fetch("http://judge0.lunaghs.dev/workers",    { cache: "no-store" }),
                fetch("http://judge0.lunaghs.dev/statistics", { cache: "no-store" }),
            ]);
            const [about, workers, stats] = (await Promise.all([
                aboutRes.ok   ? aboutRes.json()   : Promise.resolve(null),
                workersRes.ok ? workersRes.json() : Promise.resolve(null),
                statsRes.ok   ? statsRes.json()   : Promise.resolve(null),
            ])) as [
                { version: string } | null,
                { queue: string; size: number; available: number; idle: number;
                  working: number; paused: number; failed: number }[] | null,
                { submissions: { total: number; today: number } } | null,
            ];
            return {
                online: true,
                about:   about   as { version: string } | null,
                workers: workers as { queue: string; size: number; available: number;
                                     idle: number; working: number; paused: number;
                                     failed: number }[] | null,
                stats:   stats   as { submissions: { total: number; today: number } } | null,
            };
        } catch {
            return { online: false, about: null, workers: null, stats: null };
        }
    }),

    getJavaRuntimes: publicProcedure.query(async () => {
        type ResponseData = [{ name: string; id: string }];
        const response = await fetch("http://judge0.lunaghs.dev/languages");
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
                time: z.string().nullable(),
                memory: z.number().nullable(),
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

            // Fetch user and problem data in parallel – problem comes from the
            // external API rather than the local database.
            const [user, apiResult] = await Promise.all([
                db
                    .select()
                    .from(userTable)
                    .where(eq(userTable.id, userID))
                    .limit(1)
                    .then((rows) => rows[0]),
                getProblemById(problemId),
            ]);

            if (!apiResult.success || !apiResult.problem) {
                throw new Error("Failed to read problem");
            }

            const apiProblem = apiResult.problem;

            // Fetch test input and output from their respective URLs in parallel.
            console.log(apiProblem.test_output_url);
            const [testInput, testOutput] = await Promise.all([
                fetchUrlContent(apiProblem.test_data_url),
                fetchUrlContent(apiProblem.test_output_url),
            ]);

            const normalizedTestOutput = testOutput.replaceAll("\r", "");

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

            const executionResult = await executeCode(
                code,
                languageId,
                testInput,
            );

            const diff = diffStrings(
                executionResult.stdout ?? "",
                normalizedTestOutput,
            );
            const dist = distance(
                executionResult.stdout ?? "",
                normalizedTestOutput,
            );
            const accepted = dist < LEVENSHTEIN_DISTANCE_THRESHOLD;
            const score = accepted ? CalculateScore(numSubmissions) : 0;
            const alreadySucceeded =
                prevSubmissions.find((ps) => ps.accepted) !== undefined;

            if (!alreadySucceeded) {
                await db.insert(submission).values({
                    problemId: apiProblem.id,
                    userId: userID,
                    maxPoints: 60,
                    points: score,
                    accepted: accepted,
                    isStudentVisible: user?.showSubmissionScores ?? false,
                    submittedCode: code,
                    attemptNumber: numSubmissions,
                });
            }

            console.dir({
                accepted,
                distance: dist,
                diff,
                output: executionResult.stdout,
                expected: normalizedTestOutput,
                compileOutput: executionResult.compile_output,
            });

            return {
                accepted,
                attemptNumber: numSubmissions,
                score,
                diff,
                distance: dist,
                executionResult: executionResult,
                compileOutput: executionResult.compile_output,
            };
        }),
});
export type AppRouter = typeof executeRouter;
