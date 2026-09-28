/** Roles allowed to use teacher tools. */
const TEACHER_ROLES = new Set(["teacher", "site-admin"]);

/** Whether a user can use teacher tools (teachers and site admins). */
export function isTeacher(user: { role?: string | null }): boolean {
    return TEACHER_ROLES.has(user.role ?? "");
}
