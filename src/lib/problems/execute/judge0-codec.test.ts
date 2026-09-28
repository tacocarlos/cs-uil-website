import { describe, expect, test } from "bun:test";
import { decodeJudge0Response, encodeSubmission } from "./judge0-codec";

const b64 = (bytes: string | Uint8Array) =>
    Buffer.from(bytes as string).toString("base64");

describe("encodeSubmission", () => {
    test("base64-encodes source and stdin, including non-ASCII", () => {
        const body = encodeSubmission('print("héllo")', "71", "ñ\n");
        expect(body.language_id).toBe("71");
        expect(Buffer.from(body.source_code, "base64").toString()).toBe(
            'print("héllo")',
        );
        expect(Buffer.from(body.stdin, "base64").toString()).toBe("ñ\n");
    });
});

describe("decodeJudge0Response", () => {
    const base = {
        time: "0.01",
        memory: 1000,
        token: "t",
        status: { id: 3, description: "Accepted" },
    };

    test("decodes every text field", () => {
        const result = decodeJudge0Response({
            ...base,
            stdout: b64("out\n"),
            stderr: b64("err"),
            compile_output: b64("warning"),
            message: b64("msg"),
        });
        expect(result).toMatchObject({
            stdout: "out\n",
            stderr: "err",
            compile_output: "warning",
            message: "msg",
            status: { description: "Accepted" },
        });
    });

    test("keeps missing fields null", () => {
        const result = decodeJudge0Response({
            ...base,
            stdout: null,
            stderr: null,
            compile_output: null,
        });
        expect(result.stdout).toBeNull();
        expect(result.message).toBeNull();
    });

    test("turns invalid UTF-8 output into replacement characters", () => {
        // 0xC8 alone is not valid UTF-8; plain-text Judge0 refuses this.
        const result = decodeJudge0Response({
            ...base,
            stdout: Buffer.from([0x61, 0xc8, 0x62]).toString("base64"),
            stderr: null,
            compile_output: null,
        });
        expect(result.stdout).toBe("a�b");
    });

    test("reports Judge0 error responses readably", () => {
        expect(() =>
            decodeJudge0Response({ error: "queue is full", token: "t" }),
        ).toThrow("Judge0 rejected the submission: queue is full");
    });
});
