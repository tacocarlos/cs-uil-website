import {
    createCipheriv,
    createDecipheriv,
    hkdfSync,
    randomBytes,
} from "node:crypto";

/**
 * Encryption for teachers' PrairieLearn tokens at rest (AES-256-GCM), so a
 * leaked database or backup doesn't hand out PrairieLearn access. The key
 * is derived from BETTER_AUTH_SECRET; changing that secret makes stored
 * tokens unreadable, and teachers then have to enter theirs again.
 *
 * Stored as "v1.<iv>.<auth tag>.<ciphertext>", each part base64url.
 */

const VERSION = "v1";

function key(secret: string): Buffer {
    return Buffer.from(
        hkdfSync("sha256", secret, "", "uil.prairielearn-token", 32),
    );
}

export function encryptToken(token: string, secret: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key(secret), iv);
    const ciphertext = Buffer.concat([
        cipher.update(token, "utf8"),
        cipher.final(),
    ]);
    return [VERSION, iv, cipher.getAuthTag(), ciphertext]
        .map((part) =>
            typeof part === "string" ? part : part.toString("base64url"),
        )
        .join(".");
}

/** The token, or null if it can't be decrypted (e.g. the secret changed). */
export function decryptToken(stored: string, secret: string): string | null {
    const [version, iv, tag, ciphertext, ...rest] = stored.split(".");
    if (version !== VERSION || !iv || !tag || !ciphertext || rest.length) {
        return null;
    }
    try {
        const decipher = createDecipheriv(
            "aes-256-gcm",
            key(secret),
            Buffer.from(iv, "base64url"),
        );
        decipher.setAuthTag(Buffer.from(tag, "base64url"));
        return Buffer.concat([
            decipher.update(Buffer.from(ciphertext, "base64url")),
            decipher.final(),
        ]).toString("utf8");
    } catch {
        return null;
    }
}
