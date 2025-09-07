import createTable from "./createTable";
import { primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";

export const roles = createTable("role", (d) => ({
    id: d.serial().primaryKey(),
    name: d.text({ enum: ["student", "teacher", "admin"] }).default("student"),
    description: d.text().notNull(),
}));
export type Role = typeof roles.$inferSelect;

export const permissions = createTable("permissions", (d) => ({
    id: d.serial().primaryKey(),
    name: d.text().notNull().unique(),
    description: d.text().notNull(),
    resource: d.text({ enum: ["problem", "scores", "team"] }).notNull(),
    action: d
        .text({
            enum: [
                "execute-code",
                "manage-leaderboard-scores",
                "manage-student-scores",
                "create-uil-team",
                "access",
                "create",
                "modify",
            ],
        })
        .notNull(),
}));
export type Permission = typeof permissions.$inferInsert;

export const userRoles = createTable(
    "user_roles",
    (d) => ({
        userId: d
            .text()
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        roleId: d
            .integer()
            .notNull()
            .references(() => roles.id, { onDelete: "cascade" }),
    }),
    (t) => [primaryKey({ columns: [t.userId, t.roleId] })],
);

export type UserRole = typeof userRoles.$inferInsert;

export const rolePermissions = createTable(
    "role_permissions",
    (d) => ({
        roleId: d
            .integer("role_id")
            .notNull()
            .references(() => roles.id, { onDelete: "cascade" }),
        permissionId: d
            .integer("permission_id")
            .notNull()
            .references(() => permissions.id, { onDelete: "cascade" }),
    }),
    (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })],
);
export type RolePermission = typeof rolePermissions.$inferInsert;

export const userRelations = relations(user, ({ many }) => ({
    userRoles: many(userRoles),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
    userRoles: many(userRoles),
    rolePermissions: many(rolePermissions),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
    user: one(user, {
        fields: [userRoles.userId],
        references: [user.id],
    }),
    role: one(roles, {
        fields: [userRoles.roleId],
        references: [roles.id],
    }),
}));

export const rolePermissionsRelations = relations(
    rolePermissions,
    ({ one }) => ({
        role: one(roles, {
            fields: [rolePermissions.roleId],
            references: [roles.id],
        }),
        permission: one(permissions, {
            fields: [rolePermissions.permissionId],
            references: [permissions.id],
        }),
    }),
);
