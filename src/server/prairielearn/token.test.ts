import { describe, expect, test } from "vitest";
import { decryptToken, encryptToken } from "./token";

const SECRET = "a-test-secret-that-is-long-enough";
const TOKEN = "3c1d6f0e-0000-4000-8000-123456789abc";

describe("PrairieLearn token encryption", () => {
    test("round-trips", () => {
        expect(decryptToken(encryptToken(TOKEN, SECRET), SECRET)).toBe(TOKEN);
    });

    test("doesn't store the token in the clear", () => {
        expect(encryptToken(TOKEN, SECRET)).not.toContain(TOKEN);
    });

    test("encrypts the same token differently each time", () => {
        expect(encryptToken(TOKEN, SECRET)).not.toBe(
            encryptToken(TOKEN, SECRET),
        );
    });

    test("can't be read with another secret", () => {
        expect(
            decryptToken(encryptToken(TOKEN, SECRET), "another-secret"),
        ).toBeNull();
    });

    test("rejects tampered or malformed values", () => {
        const stored = encryptToken(TOKEN, SECRET);
        const parts = stored.split(".");
        const ciphertext = Buffer.from(parts[3]!, "base64url");
        ciphertext[0]! ^= 1;
        parts[3] = ciphertext.toString("base64url");
        expect(decryptToken(parts.join("."), SECRET)).toBeNull();
        expect(decryptToken("not-a-token", SECRET)).toBeNull();
        expect(decryptToken(`v2${stored.slice(2)}`, SECRET)).toBeNull();
    });
});
