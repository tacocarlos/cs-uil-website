import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";
import { type UserRole } from "./roles";

/**
 * What each global role may do through better-auth's admin plugin
 * (/api/auth/admin/*: listing, banning, impersonating users, and so on).
 * Only site admins get anything. Shared by auth.ts and auth-client.ts, so
 * kept free of server imports.
 */
export const accessControl = createAccessControl(defaultStatements);

const noAdminAccess = accessControl.newRole({ user: [], session: [] });

export const adminPluginRoles: Record<
    UserRole,
    ReturnType<typeof accessControl.newRole>
> = {
    "site-admin": accessControl.newRole(adminAc.statements),
    teacher: noAdminAccess,
    student: noAdminAccess,
};
