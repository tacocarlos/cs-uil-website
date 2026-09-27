import {
    foreignKey,
    pgTableCreator,
    type AnyPgColumn,
} from "drizzle-orm/pg-core";

export const TABLE_PREFIX = "uil_";

const createTable = pgTableCreator((name) => `${TABLE_PREFIX}${name}`);

export default createTable;

/**
 * Foreign key with an explicit name that deletes rows when the referenced row
 * is deleted.
 *
 * Postgres truncates identifiers over 63 characters. Drizzle's generated FK
 * names can exceed that, and the truncated name then never matches on
 * introspection, so `drizzle-kit push` drops and re-adds the FK every run.
 * Naming FKs explicitly (`<table>_<column>_fk`) avoids that.
 */
export function cascadeFk(
    name: string,
    column: AnyPgColumn,
    references: AnyPgColumn,
) {
    return foreignKey({
        name,
        columns: [column],
        foreignColumns: [references],
    }).onDelete("cascade");
}
