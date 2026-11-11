import { text, timestamp, boolean } from "drizzle-orm/pg-core";
import { USER_ROLES } from "~/lib/auth/roles";
import createTable, { cascadeFk } from "./createTable";

export const user = createTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    /**
     * Unique. Accounts made with a username instead of Google get a
     * placeholder here (see src/lib/auth/usernames.ts), never a real address.
     */
    email: text("email").notNull().unique(),
    // Username plugin (auth.ts): sign-in name, stored lowercase, and as
    // typed. Null for Google accounts.
    username: text("username").unique(),
    displayUsername: text("display_username"),
    emailVerified: boolean("email_verified")
        .$defaultFn(() => false)
        .notNull(),
    image: text("image"),
    createdAt: timestamp("created_at")
        .$defaultFn(() => /* @__PURE__ */ new Date())
        .notNull(),
    updatedAt: timestamp("updated_at")
        .$defaultFn(() => /* @__PURE__ */ new Date())
        .notNull(),
    showSubmissionScores: boolean().notNull().default(true),
    role: text({ enum: USER_ROLES }).default("student"),
    showScoresInLeaderboard: boolean().notNull().default(true),
    /**
     * Opt-in: also appear on the leaderboards shared by all schools. Only
     * applies when showScoresInLeaderboard is on.
     */
    showInGlobalLeaderboard: boolean().notNull().default(false),
    // Admin plugin (auth.ts). A ban past its expiry is lifted the next time
    // the user signs in, so `banned` can be stale; see isBanActive.
    banned: boolean("banned").default(false),
    banReason: text("ban_reason"),
    /** When the ban ends; null for a ban with no end. */
    banExpires: timestamp("ban_expires"),
    /**
     * Last time the user loaded a page while signed in, to within a few
     * minutes (see src/server/analytics.ts). Null until they next do.
     */
    lastActiveAt: timestamp("last_active_at"),
});
export type User = typeof user.$inferSelect;

export const session = createTable(
    "session",
    {
        id: text("id").primaryKey(),
        expiresAt: timestamp("expires_at").notNull(),
        token: text("token").notNull().unique(),
        createdAt: timestamp("created_at").notNull(),
        updatedAt: timestamp("updated_at").notNull(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        userId: text("user_id").notNull(),
        /** School the user is currently acting in (organization plugin). */
        activeOrganizationId: text("active_organization_id"),
        /** Site admin impersonating this session's user (admin plugin). */
        impersonatedBy: text("impersonated_by"),
    },
    (t) => [cascadeFk("session_user_id_fk", t.userId, user.id)],
);

export const account = createTable(
    "account",
    {
        id: text("id").primaryKey(),
        accountId: text("account_id").notNull(),
        providerId: text("provider_id").notNull(),
        userId: text("user_id").notNull(),
        accessToken: text("access_token"),
        refreshToken: text("refresh_token"),
        idToken: text("id_token"),
        accessTokenExpiresAt: timestamp("access_token_expires_at"),
        refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
        scope: text("scope"),
        password: text("password"),
        createdAt: timestamp("created_at").notNull(),
        updatedAt: timestamp("updated_at").notNull(),
    },
    (t) => [cascadeFk("account_user_id_fk", t.userId, user.id)],
);
export type Account = typeof account.$inferSelect;

export const verification = createTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").$defaultFn(
        () => /* @__PURE__ */ new Date(),
    ),
    updatedAt: timestamp("updated_at").$defaultFn(
        () => /* @__PURE__ */ new Date(),
    ),
});
