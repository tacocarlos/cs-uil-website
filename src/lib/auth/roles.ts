/**
 * Global user roles (`uil_user.role`). Only "site-admin" grants anything
 * site-wide; teaching is a per-school role (see organizations.ts). Kept
 * free of server imports so client components can use it.
 */
export const USER_ROLES = ["student", "teacher", "site-admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Site admins manage every school and contest. */
export function isSiteAdmin(role: string | null | undefined): boolean {
    return role === "site-admin";
}
