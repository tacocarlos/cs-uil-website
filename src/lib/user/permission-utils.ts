import { db } from "~/server/db";
import { eq, and, inArray } from "drizzle-orm";
import { user, type User } from "~/server/db/schema/auth";
import {
    type Permission,
    permissions,
    type Role,
    rolePermissions,
    roles,
    userRoles,
} from "~/server/db/schema/role";

// Add a role to a user
export async function assignRoleToUser(
    userId: User["id"],
    roleId: Role["id"],
): Promise<{ success: boolean }> {
    try {
        await db
            .insert(userRoles)
            .values({
                userId,
                roleId,
            })
            .onConflictDoNothing();
        return { success: true };
    } catch (error) {
        console.error("Error assigning role to user:", error);
        return { success: false };
    }
}

export async function getUserRoles(userId: User["id"]) {
    const userRolesEntries = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.userId, userId));
    const userRolesIds = userRolesEntries.map((v) => v.roleId);

    // if (userRolesEntries.length === 0) {
    // 	db.insert(userRoles).values({
    // 		roleId:
    // 	})
    // }

    const result = await db
        .select()
        .from(roles)
        .where(inArray(roles.id, userRolesIds));

    return result;
}

// Add a permission to a role
export async function assignPermissionToRole(
    roleId: number,
    permissionId: number,
): Promise<{ success: boolean }> {
    try {
        await db
            .insert(rolePermissions)
            .values({
                roleId,
                permissionId,
            })
            .onConflictDoNothing();
        return { success: true };
    } catch (error) {
        console.error("Error assigning permission to role:", error);
        return { success: false };
    }
}

// Define a type for permission check result
export async function userHasPermission(
    userId: User["id"],
    resource: Permission["resource"],
    action: Permission["action"],
): Promise<boolean> {
    const result = await db
        .select()
        .from(user)
        .innerJoin(userRoles, eq(user.id, userRoles.userId))
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
        .innerJoin(
            permissions,
            eq(rolePermissions.permissionId, permissions.id),
        )
        .where(
            and(
                eq(user.id, userId),
                eq(permissions.resource, resource),
                eq(permissions.action, action),
            ),
        );

    return result.length > 0;
}

// Get all permissions for a user
export async function getUserPermissions(userId: User["id"]) {
    return db
        .select({
            permissionId: permissions.id,
            permissionName: permissions.name,
            resource: permissions.resource,
            action: permissions.action,
        })
        .from(user)
        .innerJoin(userRoles, eq(user.id, userRoles.userId))
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
        .innerJoin(
            permissions,
            eq(rolePermissions.permissionId, permissions.id),
        )
        .where(eq(user.id, userId));
}
