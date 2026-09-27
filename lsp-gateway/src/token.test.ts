import { createHmac } from "node:crypto";
import { describe, expect, test } from "bun:test";
import { verifyToken } from "./token";

const SECRET = "x".repeat(32);
const NOW = Date.UTC(2026, 0, 1);

function sign(payload: object, secret = SECRET): string {
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = createHmac("sha256", secret)
        .update(body)
        .digest("base64url");
    return `${body}.${signature}`;
}

const valid = { sub: "user-1", srv: "java", exp: NOW / 1000 + 60 };

describe("verifyToken", () => {
    test("accepts a valid token", () => {
        expect(verifyToken(sign(valid), SECRET, "java", NOW)).toEqual({
            ok: true,
            payload: valid,
        });
    });

    test("rejects a token signed with another secret", () => {
        const token = sign(valid, "y".repeat(32));
        expect(verifyToken(token, SECRET, "java", NOW)).toMatchObject({
            ok: false,
            reason: "bad signature",
        });
    });

    test("rejects a tampered payload", () => {
        const [, signature] = sign(valid).split(".");
        const forged = Buffer.from(
            JSON.stringify({ ...valid, sub: "admin" }),
        ).toString("base64url");
        expect(
            verifyToken(`${forged}.${signature}`, SECRET, "java", NOW),
        ).toMatchObject({ ok: false, reason: "bad signature" });
    });

    test("rejects an expired token", () => {
        const token = sign({ ...valid, exp: NOW / 1000 - 1 });
        expect(verifyToken(token, SECRET, "java", NOW)).toMatchObject({
            ok: false,
            reason: "expired",
        });
    });

    test("rejects a token for a different server", () => {
        expect(verifyToken(sign(valid), SECRET, "python", NOW)).toMatchObject({
            ok: false,
            reason: "wrong server",
        });
    });

    test("rejects malformed tokens", () => {
        for (const token of ["", "abc", "a.b.c", "!!!.???"]) {
            expect(verifyToken(token, SECRET, "java", NOW).ok).toBe(false);
        }
    });
});
