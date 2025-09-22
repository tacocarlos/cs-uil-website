import { index } from "drizzle-orm/pg-core";
import createTable from "./createTable";
import { randomUUID } from "crypto";
import { user } from "./auth";
import { problems } from "./problem";

export const forefeits = createTable(
    "forefeits",
    (d) => ({
        id: d.text().primaryKey().$defaultFn(randomUUID).unique(),
        problemId: d
            .integer()
            .notNull()
            .references(() => problems.id, { onDelete: "cascade" }),
        userId: d
            .text()
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        forefeitedAt: d.timestamp().defaultNow().notNull(),
    }),
    (t) => [index("u_idx").on(t.userId), index("p_idx").on(t.problemId)],
);
