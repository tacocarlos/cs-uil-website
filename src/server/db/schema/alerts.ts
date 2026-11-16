import createTable, { cascadeFk } from "./createTable";
import { index } from "drizzle-orm/pg-core";
import { user } from "./auth";

type UserFeatureRequestMetadata = {
    kind: "user-feature-request";
    featureRequestId: number;
}

type AdminFeatureRequestMetadata = {
    kind: "admin-feature-request";
    featureRequestId: number;
}

export type AlertMetadata = UserFeatureRequestMetadata | AdminFeatureRequestMetadata;

export const alert = createTable("alert", (d) => ({
    id: d.serial().primaryKey(),
    userId: d.text().notNull(),
    createdAt: d.timestamp().notNull().defaultNow(),
    updatedAt: d.timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
    deletedAt: d.timestamp(),
    readAt: d.timestamp(),
    content: d.text().notNull(),
    redirectUrl: d.text(),
    metadata: d.jsonb().$type<AlertMetadata>(),
}), (t) => [
    cascadeFk("alert_user_id_fk", t.userId, user.id),
    index("alert_user_idx").on(t.userId, t.readAt)
]);