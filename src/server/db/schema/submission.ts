import { index } from "drizzle-orm/pg-core";
import createTable from "./createTable";
import { problems } from "./problem";
import { user } from "./auth";
import { randomUUID } from "crypto";

export const submission = createTable(
    "submission",
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
        timeSubmitted: d.timestamp().defaultNow().notNull(),
        points: d.integer().notNull().default(0),
        maxPoints: d.integer().notNull().default(60),
        accepted: d.boolean().default(false),
        submittedCode: d.text().notNull(),
        isStudentVisible: d.boolean().notNull().default(true),
    }),
    (t) => [
        index("problem_idx").on(t.problemId),
        index("user_idx").on(t.userId),
    ],
);

export type Submission = typeof submission.$inferSelect;
