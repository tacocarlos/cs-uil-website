function required(name: string): string {
    const value = process.env[name];
    if (!value)
        throw new Error(`Missing required environment variable ${name}`);
    return value;
}

function int(name: string, fallback: number): number {
    const raw = process.env[name];
    if (!raw) return fallback;
    const value = Number.parseInt(raw, 10);
    if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`${name} must be a positive integer, got "${raw}"`);
    }
    return value;
}

export type Config = ReturnType<typeof loadConfig>;

export function loadConfig() {
    const secret = required("LSP_GATEWAY_SECRET");
    if (secret.length < 32) {
        throw new Error("LSP_GATEWAY_SECRET must be at least 32 characters");
    }

    return {
        port: int("PORT", 3100),
        /** Shared with the website, which signs connection tokens with it. */
        secret,
        /**
         * Browser origins allowed to connect, e.g. https://uil.example.com.
         * Empty allows any origin (fine for local development only).
         */
        allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "")
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean),
        maxSessions: int("MAX_SESSIONS", 20),
        maxSessionsPerUser: int("MAX_SESSIONS_PER_USER", 2),
        /** Close sessions with no editor activity for this long. */
        idleTimeoutMs: int("IDLE_TIMEOUT_MINUTES", 15) * 60_000,
        /** Parent directory for per-session scratch workspaces. */
        workspaceRoot: process.env.WORKSPACE_ROOT ?? "/tmp/lsp-sessions",
    };
}
