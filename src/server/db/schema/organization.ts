import { index, text, timestamp, unique } from "drizzle-orm/pg-core";
import createTable, { cascadeFk } from "./createTable";
import { user } from "./auth";

// Tables for better-auth's organization plugin (see auth.ts). An
// organization is a school. Property names must match the plugin's field
// names, since the drizzle adapter looks fields up by them.

// ── organization ──────────────────────────────────────────────────────────────

export const organization = createTable("organization", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    createdAt: timestamp("created_at").notNull(),
    metadata: text("metadata"),
});
export type Organization = typeof organization.$inferSelect;

// ── member ────────────────────────────────────────────────────────────────────

export const member = createTable(
    "member",
    {
        id: text("id").primaryKey(),
        organizationId: text("organization_id").notNull(),
        userId: text("user_id").notNull(),
        /** owner | admin (teachers) | member (students) */
        role: text("role").notNull().default("member"),
        createdAt: timestamp("created_at").notNull(),
    },
    (t) => [
        unique("member_organization_user_unique").on(
            t.organizationId,
            t.userId,
        ),
        index("member_user_idx").on(t.userId),
        cascadeFk(
            "member_organization_id_fk",
            t.organizationId,
            organization.id,
        ),
        cascadeFk("member_user_id_fk", t.userId, user.id),
    ],
);
export type Member = typeof member.$inferSelect;

// ── invitation ────────────────────────────────────────────────────────────────

/**
 * Required by the plugin but unused: students join with a code, since they
 * can't be assumed to receive email.
 */
export const invitation = createTable(
    "invitation",
    {
        id: text("id").primaryKey(),
        organizationId: text("organization_id").notNull(),
        email: text("email").notNull(),
        role: text("role"),
        status: text("status").notNull().default("pending"),
        expiresAt: timestamp("expires_at").notNull(),
        createdAt: timestamp("created_at").notNull(),
        inviterId: text("inviter_id").notNull(),
    },
    (t) => [
        cascadeFk(
            "invitation_organization_id_fk",
            t.organizationId,
            organization.id,
        ),
        cascadeFk("invitation_inviter_id_fk", t.inviterId, user.id),
    ],
);
