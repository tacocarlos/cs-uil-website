/**
 * better-auth's organization plugin serves its own API under
 * /api/auth/organization/*: deleting schools, changing roles, removing
 * members, email invitations, and more. Those calls would skip this site's
 * rules (site admins manage schools and teachers; teachers manage students
 * through tRPC; there are no email invitations), so auth.ts refuses every
 * organization endpoint except the few the site relies on. Everything else
 * about schools goes through the `school.*` tRPC procedures.
 */
export const ALLOWED_ORGANIZATION_PATHS = new Set([
    // Switching the active school (school switcher; school.join/leave).
    "/organization/set-active",
    // The user's schools (school switcher).
    "/organization/list",
    // The user's role in the active school (navbar's teacher links).
    "/organization/get-active-member",
]);

/** Whether a better-auth endpoint path is refused (see above). */
export function isBlockedAuthPath(path: string): boolean {
    return (
        path.startsWith("/organization/") &&
        !ALLOWED_ORGANIZATION_PATHS.has(path)
    );
}
