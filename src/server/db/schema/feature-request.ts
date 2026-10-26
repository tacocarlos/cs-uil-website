import { index } from "drizzle-orm/pg-core";
import { user } from "./auth";
import createTable, { cascadeFk } from "./createTable";

export const featureRequest = createTable(
    "featureRequest",
    (d) => ({
        id: d.serial().primaryKey(),
        deletedAt: d.timestamp(),
        timeSubmitted: d.timestamp().defaultNow().notNull(),
        featureStatus: d
            .text({ enum: ["pending", "accepted", "implemented", "denied"] })
            .default("pending")
            .notNull(),
        userId: d.text().notNull(),
        message: d.text().notNull(),
        adminResponse: d.text(),
        category: d
            .text({
                enum: ["problem", "contest", "bug", "other"],
            })
            .notNull(),
    }),
    (t) => [
        cascadeFk("feat_req_user_id_fk", t.userId, user.id),
        index("feat_req_user_idx").on(t.userId),
        index("feat_req_cat_idx").on(t.category),
        index("feat_req_status_idx").on(t.featureStatus),
    ],
);
