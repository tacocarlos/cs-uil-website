-- Drops every app table (those prefixed `uil_`, see TABLE_PREFIX in
-- src/server/db/schema/createTable.ts). Run `bun run db:push` afterwards to
-- recreate them. DEV ONLY: this deletes all data.
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public' AND tablename LIKE 'uil\_%'
    LOOP
        EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', t);
    END LOOP;
END $$;
