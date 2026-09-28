/**
 * Fake accounts for local development, so testing doesn't need a real
 * Google login. Only usable when devLoginEnabled() (dev-login.ts) is true.
 * Kept free of server imports so the sign-in buttons can use it.
 */
export const DEV_ACCOUNTS = {
    student: {
        name: "Dev Student",
        email: "dev-student@dev.local",
        role: "student",
    },
    teacher: {
        name: "Dev Teacher",
        email: "dev-teacher@dev.local",
        role: "teacher",
    },
} as const;

export type DevAccountKind = keyof typeof DEV_ACCOUNTS;
