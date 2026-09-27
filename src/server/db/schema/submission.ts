import { index } from "drizzle-orm/pg-core";
import createTable, { cascadeFk } from "./createTable";

import { user } from "./auth";
import { randomUUID } from "crypto";

export const submission = createTable(
    "submission",
    (d) => ({
        id: d.text().primaryKey().$defaultFn(randomUUID),
        problemId: d.integer().notNull(),
        userId: d.text().notNull(),
        timeSubmitted: d.timestamp().defaultNow().notNull(),
        points: d.integer().notNull().default(0),
        maxPoints: d.integer().notNull().default(60),
        accepted: d.boolean().default(false),
        submittedCode: d.text().notNull(),
        isStudentVisible: d.boolean().notNull().default(true),
        attemptNumber: d.integer().notNull().default(1),
    }),
    (t) => [
        index("problem_idx").on(t.problemId),
        index("user_idx").on(t.userId),
        cascadeFk("submission_user_id_fk", t.userId, user.id),
    ],
);

export type Submission = typeof submission.$inferSelect;
