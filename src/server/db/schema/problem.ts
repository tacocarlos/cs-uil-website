// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { index, sqliteTableCreator } from "drizzle-orm/sqlite-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = sqliteTableCreator(
  (name) => `cs-uil-website_${name}`,
);

// export const posts = createTable(
//   "post",
//   (d) => ({
//     id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
//     name: d.text({ length: 256 }),
//     createdAt: d
//       .integer({ mode: "timestamp" })
//       .default(sql`(unixepoch())`)
//       .notNull(),
//     updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
//   }),
//   (t) => [index("name_idx").on(t.name)],
// );

export const problems = createTable(
  "problems",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    problemName: d.text({ length: 256 }).notNull(),
    competitionYear: d.integer({ mode: "number" }).notNull(),
    competitionLevel: d.text().notNull(),
    problemText: d.text().notNull(),
    programName: d.text().notNull(),
    inputFileName: d.text(),
    defaultInputFile: d.text(),
    enabled: d.integer({ mode: "boolean" }).default(false).notNull(),
  }),
  (t) => [
    index("year_idx").on(t.competitionYear),
    index("level_idx").on(t.competitionLevel),
    index("problem_name_idx").on(t.problemName),
  ],
);
