/**
 * The school every existing user was moved into when organizations were
 * added (see the backfill migration in drizzle/). Dev accounts join it too.
 */
export const DEFAULT_ORGANIZATION = {
    id: "groveton-hs",
    name: "Groveton High School",
    slug: "groveton",
} as const;

/**
 * Roles in a school, highest first. The single source of truth for the
 * `uil_member.role` column, inputs, and labels.
 */
export const MEMBER_ROLES = ["owner", "admin", "member"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

/** Owners and admins of a school are its teachers. */
export const TEACHER_ROLES = ["owner", "admin"] as const satisfies MemberRole[];

/** How each role is shown to users. */
export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
    owner: "Teacher (owner)",
    admin: "Teacher",
    member: "Student",
};

export function isTeacherRole(role: string | null | undefined): boolean {
    return TEACHER_ROLES.includes(role as (typeof TEACHER_ROLES)[number]);
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
