import { judge0ResultSchema, type Judge0Result } from "./judge0-result";

// Judge0 is used with base64_encoded=true. In plain-text mode it refuses to
// return output that isn't valid UTF-8 (e.g. a program printing a stray
// (char)200) and sends an `error` instead of a result.

const toBase64 = (text: string) => Buffer.from(text, "utf8").toString("base64");

/** Invalid UTF-8 in program output becomes U+FFFD rather than failing. */
const fromBase64 = (encoded: string | null | undefined) =>
    encoded == null ? null : Buffer.from(encoded, "base64").toString("utf8");

/** Request body for POST /submissions?base64_encoded=true. */
export function encodeSubmission(
    code: string,
    languageId: string,
    stdin: string,
) {
    return {
        source_code: toBase64(code),
        language_id: languageId,
        stdin: toBase64(stdin),
    };
}

/**
 * Turns a base64 Judge0 response into a result with plain-text fields.
 * Throws a readable error when Judge0 answers with `{ error }` instead of a
 * result.
 */
export function decodeJudge0Response(body: unknown): Judge0Result {
    if (
        body &&
        typeof body === "object" &&
        "error" in body &&
        !("status" in body)
    ) {
        throw new Error(
            `Judge0 rejected the submission: ${String(body.error)}`,
        );
    }
    const raw = judge0ResultSchema.parse(body);
    return {
        ...raw,
        stdout: fromBase64(raw.stdout),
        stderr: fromBase64(raw.stderr),
        compile_output: fromBase64(raw.compile_output),
        message: fromBase64(raw.message),
    };
}
