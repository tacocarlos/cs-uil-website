import { createHmac } from "node:crypto";

/**
 * Short-lived token authorizing one LSP gateway connection. Format:
 * `<base64url(JSON payload)>.<base64url(HMAC-SHA256(secret, payload part))>`.
 * Verified by `lsp-gateway/src/token.ts`; keep the two in sync.
 */
export type LspTokenPayload = {
    /** User ID, used for per-user session limits */
    sub: string;
    /** Server the token is valid for */
    srv: string;
    /** Expiry, in Unix seconds */
    exp: number;
};

/** Tokens only need to live long enough to open the WebSocket. */
export const LSP_TOKEN_TTL_SECONDS = 60;

export function signLspToken(
    claims: Omit<LspTokenPayload, "exp">,
    secret: string,
    now = Date.now(),
): string {
    const payload: LspTokenPayload = {
        ...claims,
        exp: Math.floor(now / 1000) + LSP_TOKEN_TTL_SECONDS,
    };
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = createHmac("sha256", secret)
        .update(body)
        .digest("base64url");
    return `${body}.${signature}`;
}
