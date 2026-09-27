import { z } from "zod";

// Kept separate from judge0.ts (which reads server env vars) so client code
// can import the result type and helpers.

export const judge0ResultSchema = z.object({
    stdout: z.string().nullable(),
    stderr: z.string().nullable(),
    compile_output: z.string().nullable(),
    /** Judge0's own explanation when something went wrong, e.g. sandbox errors. */
    message: z.string().nullable().optional(),
    // Null when the program never ran (e.g. compilation error).
    time: z.string().nullable(),
    memory: z.number().nullable(),
    token: z.string(),
    status: z.object({
        id: z.number(),
        description: z.string(),
    }),
});

export type Judge0Result = z.infer<typeof judge0ResultSchema>;

/** https://ce.judge0.com/#statuses-and-languages-status-get */
export const JUDGE0_STATUS = {
    ACCEPTED: 3,
    INTERNAL_ERROR: 13,
    EXEC_FORMAT_ERROR: 14,
} as const;

/** True when Judge0 itself failed, as opposed to the submitted program. */
export function isJudge0Failure(result: Judge0Result): boolean {
    return (
        result.status.id === JUDGE0_STATUS.INTERNAL_ERROR ||
        result.status.id === JUDGE0_STATUS.EXEC_FORMAT_ERROR
    );
}

/**
 * Everything worth showing in an "errors" pane: the status when the run
 * didn't finish normally (TLE, runtime error, internal error…) plus any
 * compiler output and stderr. Null when there's nothing to show.
 */
export function formatJudge0Errors(result: Judge0Result): string | null {
    const parts: string[] = [];
    if (result.status.id !== JUDGE0_STATUS.ACCEPTED) {
        parts.push(
            result.message
                ? `${result.status.description}: ${result.message}`
                : result.status.description,
        );
    }
    if (result.compile_output) parts.push(result.compile_output);
    if (result.stderr) parts.push(result.stderr);
    return parts.length > 0 ? parts.join("\n\n") : null;
}
