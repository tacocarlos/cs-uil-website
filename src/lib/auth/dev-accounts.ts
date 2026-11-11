import { type UserRole } from "./roles";

/**
 * Fake accounts for local development, so testing doesn't need a real
 * Google login. Only usable when devLoginEnabled() (dev-login.ts) is true.
 * Kept free of server imports so the sign-in buttons can use it.
 */
export const DEV_ACCOUNTS = {
    student: {
        name: "Dev Student",
        email: "dev-student@dev.local",
        username: "dev_student",
        role: "student",
    },
    teacher: {
        name: "Dev Teacher",
        email: "dev-teacher@dev.local",
        username: "dev_teacher",
        role: "teacher",
    },
    // Site admin (e.g. /admin); also owner of the default school.
    admin: {
        name: "Admin Test",
        email: "dev-admin@dev.local",
        username: "dev_admin",
        role: "site-admin",
    },
} as const satisfies Record<
    string,
    { name: string; email: string; username: string; role: UserRole }
>;

export type DevAccountKind = keyof typeof DEV_ACCOUNTS;

const DEV_USERNAMES = new Set<string>(
    Object.values(DEV_ACCOUNTS).map((a) => a.username),
);

/** Whether `username` (as typed, any case) belongs to a dev account. */
export function isDevUsername(username: unknown): boolean {
    return (
        typeof username === "string" &&
        DEV_USERNAMES.has(username.trim().toLowerCase())
    );
}
