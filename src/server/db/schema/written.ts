import { index } from "drizzle-orm/pg-core";
import createTable from "./createTable";
import { user } from "./auth";
import { randomUUID } from "crypto";

export const writtenTests = createTable(
    "written_tests",
    (d) => ({
        id: d.text().$defaultFn(randomUUID).primaryKey(),
        adminShow: d.boolean().default(false),
        userId: d
            .text()
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        competition: d.text({
            enum: [
                "VCM-1",
                "VCM-2",
                "VCM-3",
                "VCM-4",
                "invA",
                "invB",
                "district",
                "region",
                "state",
            ],
        }),
        seasonYear: d
            .integer()
            .notNull()
            .default(2000)
            .$defaultFn(() => new Date().getUTCFullYear()),
        score: d.integer().notNull(),
        takenAt: d.date().notNull().defaultNow(),
        accuracy: d.real().notNull().default(0),
    }),
    (t) => [
        index("written_tests_user_idx").on(t.userId),
        index("written_tests_competition_idx").on(t.competition),
    ],
);
