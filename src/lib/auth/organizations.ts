/**
 * The school every existing user was moved into when organizations were
 * added (see the backfill migration in drizzle/). Dev accounts join it too.
 */
export const DEFAULT_ORGANIZATION = {
    id: "groveton-hs",
    name: "Groveton High School",
    slug: "groveton",
} as const;

export type MemberRole = "owner" | "admin" | "member";

/** Owners and admins of a school are its teachers. */
export function isTeacherRole(role: string | null | undefined): boolean {
    return role === "owner" || role === "admin";
}

/**
 * Membership role matching a user's global role: site admins own the
 * school, teachers administer it, everyone else is a member (student).
 * The backfill migration applies the same mapping in SQL.
 */
export function memberRoleFor(
    globalRole: string | null | undefined,
): MemberRole {
    switch (globalRole) {
        case "site-admin":
            return "owner";
        case "teacher":
            return "admin";
        default:
            return "member";
    }
}
