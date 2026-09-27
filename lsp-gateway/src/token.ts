import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies tokens minted by the website (`src/lib/lsp/token.ts`). Format:
 * `<base64url(JSON payload)>.<base64url(HMAC-SHA256(secret, payload part))>`.
 */
export type TokenPayload = {
    /** User ID */
    sub: string;
    /** Server the token is valid for */
    srv: string;
    /** Expiry, in Unix seconds */
    exp: number;
};

export type TokenCheck =
    | { ok: true; payload: TokenPayload }
    | { ok: false; reason: string };

export function verifyToken(
    token: string,
    secret: string,
    expectedServer: string,
    now = Date.now(),
): TokenCheck {
    const [body, signature, ...rest] = token.split(".");
    if (!body || !signature || rest.length > 0) {
        return { ok: false, reason: "malformed token" };
    }

    const expected = createHmac("sha256", secret).update(body).digest();
    const actual = Buffer.from(signature, "base64url");
    if (
        actual.length !== expected.length ||
        !timingSafeEqual(actual, expected)
    ) {
        return { ok: false, reason: "bad signature" };
    }

    let payload: TokenPayload;
    try {
        payload = JSON.parse(
            Buffer.from(body, "base64url").toString("utf8"),
        ) as TokenPayload;
    } catch {
        return { ok: false, reason: "malformed payload" };
    }

    if (typeof payload.exp !== "number" || payload.exp * 1000 < now) {
        return { ok: false, reason: "expired" };
    }
    if (payload.srv !== expectedServer) {
        return { ok: false, reason: "wrong server" };
    }
    if (typeof payload.sub !== "string" || payload.sub === "") {
        return { ok: false, reason: "missing subject" };
    }
    return { ok: true, payload };
}
