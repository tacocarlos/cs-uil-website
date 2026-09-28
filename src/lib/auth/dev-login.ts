import { env } from "~/env";

/** Not a secret: the dev accounts only exist on allow-listed dev databases. */
export const DEV_PASSWORD = "dev-password";

/**
 * Dev login (see dev-accounts.ts) is on only when running in development
 * *and* the database is on the DEV_LOGIN_DATABASE_HOSTS allow-list
 * (comma-separated host:port). Checking the database matters because
 * `bun run dev` can point at production; dev accounts must never be created
 * there.
 */
export function devLoginEnabled(): boolean {
    if (env.NODE_ENV !== "development") return false;
    const allowed = (env.DEV_LOGIN_DATABASE_HOSTS ?? "")
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean);
    const { hostname, port } = new URL(env.DATABASE_URL);
    return allowed.includes(`${hostname}:${port || "5432"}`);
}
