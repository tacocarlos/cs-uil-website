// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { pgTableCreator, index } from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `cs-uil-website_${name}`);

export const problems = createTable(
    "problems",
    (d) => ({
        id: d.serial().primaryKey(),
        problemName: d.text().notNull(),
        competitionYear: d.integer().notNull(),
        competitionLevel: d
            .text({
                enum: ["invA", "invB", "district", "region", "state", "custom"],
            })
            .notNull(),
        problemText: d.text().notNull(),
        programName: d.text().notNull(),
        inputFileName: d.text(),
        defaultInputFile: d.text(),
        enabled: d.boolean().default(false).notNull(),
    }),
    (t) => [
        index("year_idx").on(t.competitionYear),
        index("level_idx").on(t.competitionLevel),
        index("problem_name_idx").on(t.problemName),
    ],
);
