import { date, index, primaryKey } from "drizzle-orm/pg-core";
import { AUTH_EVENT_TYPES } from "~/lib/analytics";
import { user } from "./auth";
import createTable, { cascadeFk } from "./createTable";

/**
 * Sign-ups, sign-ins, and sign-outs, for the site admin analytics page.
 * Sessions where a site admin impersonates someone aren't recorded.
 */
export const authEvent = createTable(
    "auth_event",
    (d) => ({
        id: d.serial().primaryKey(),
        userId: d.text().notNull(),
        type: d.text({ enum: AUTH_EVENT_TYPES }).notNull(),
        /** How they signed in, e.g. "google" or "email"; null otherwise. */
        method: d.text(),
        createdAt: d.timestamp().defaultNow().notNull(),
    }),
    (t) => [
        cascadeFk("auth_event_user_id_fk", t.userId, user.id),
        index("auth_event_type_created_idx").on(t.type, t.createdAt),
        index("auth_event_user_idx").on(t.userId),
    ],
);

/**
 * One row per user per day (in ANALYTICS_TIME_ZONE) they used the site while
 * signed in. Drives the active-user counts and retention.
 */
export const userActivity = createTable(
    "user_activity",
    (d) => ({
        userId: d.text().notNull(),
        day: date({ mode: "string" }).notNull(),
    }),
    (t) => [
        primaryKey({ name: "user_activity_pk", columns: [t.userId, t.day] }),
        cascadeFk("user_activity_user_id_fk", t.userId, user.id),
        index("user_activity_day_idx").on(t.day),
    ],
);
