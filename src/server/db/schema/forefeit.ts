import { index } from "drizzle-orm/pg-core";
import createTable, { cascadeFk } from "./createTable";
import { randomUUID } from "crypto";
import { user } from "./auth";

export const forefeits = createTable(
    "forefeits",
    (d) => ({
        id: d.text().primaryKey().$defaultFn(randomUUID),
        problemId: d.integer().notNull(),
        userId: d.text().notNull(),
        forefeitedAt: d.timestamp().defaultNow().notNull(),
    }),
    (t) => [
        index("u_idx").on(t.userId),
        index("p_idx").on(t.problemId),
        cascadeFk("forefeits_user_id_fk", t.userId, user.id),
    ],
);
