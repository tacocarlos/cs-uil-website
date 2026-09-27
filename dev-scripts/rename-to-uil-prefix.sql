-- One-time migration: rename the `cs-uil-website_` table prefix to `uil_` and
-- give every constraint the name the Drizzle schema now expects, then record
-- drizzle/0000_baseline.sql as already applied so `db:migrate` skips it.
--
-- Only renames objects; no data is touched. Undo with
-- rename-to-uil-prefix.down.sql.
--
-- Run: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction -f dev-scripts/rename-to-uil-prefix.sql

-- ── Tables ───────────────────────────────────────────────────────────────────
ALTER TABLE "cs-uil-website_account"            RENAME TO "uil_account";
ALTER TABLE "cs-uil-website_contest"            RENAME TO "uil_contest";
ALTER TABLE "cs-uil-website_contest_enrollment" RENAME TO "uil_contest_enrollment";
ALTER TABLE "cs-uil-website_contest_problem"    RENAME TO "uil_contest_problem";
ALTER TABLE "cs-uil-website_contest_submission" RENAME TO "uil_contest_submission";
ALTER TABLE "cs-uil-website_forefeits"          RENAME TO "uil_forefeits";
ALTER TABLE "cs-uil-website_permissions"        RENAME TO "uil_permissions";
ALTER TABLE "cs-uil-website_role"               RENAME TO "uil_role";
ALTER TABLE "cs-uil-website_role_permissions"   RENAME TO "uil_role_permissions";
ALTER TABLE "cs-uil-website_session"            RENAME TO "uil_session";
ALTER TABLE "cs-uil-website_submission"         RENAME TO "uil_submission";
ALTER TABLE "cs-uil-website_user"               RENAME TO "uil_user";
ALTER TABLE "cs-uil-website_user_roles"         RENAME TO "uil_user_roles";
ALTER TABLE "cs-uil-website_verification"       RENAME TO "uil_verification";
ALTER TABLE "cs-uil-website_written_tests"      RENAME TO "uil_written_tests";

-- ── Sequences (serial columns reference these by OID, so renaming is safe) ──
ALTER SEQUENCE "cs-uil-website_contest_id_seq"            RENAME TO "uil_contest_id_seq";
ALTER SEQUENCE "cs-uil-website_contest_enrollment_id_seq" RENAME TO "uil_contest_enrollment_id_seq";
ALTER SEQUENCE "cs-uil-website_contest_problem_id_seq"    RENAME TO "uil_contest_problem_id_seq";
ALTER SEQUENCE "cs-uil-website_permissions_id_seq"        RENAME TO "uil_permissions_id_seq";
ALTER SEQUENCE "cs-uil-website_role_id_seq"               RENAME TO "uil_role_id_seq";

-- ── Primary keys (renaming the constraint also renames its index) ──────────
ALTER TABLE "uil_account"            RENAME CONSTRAINT "cs-uil-website_account_pkey"            TO "uil_account_pkey";
ALTER TABLE "uil_contest"            RENAME CONSTRAINT "cs-uil-website_contest_pkey"            TO "uil_contest_pkey";
ALTER TABLE "uil_contest_enrollment" RENAME CONSTRAINT "cs-uil-website_contest_enrollment_pkey" TO "uil_contest_enrollment_pkey";
ALTER TABLE "uil_contest_problem"    RENAME CONSTRAINT "cs-uil-website_contest_problem_pkey"    TO "uil_contest_problem_pkey";
ALTER TABLE "uil_contest_submission" RENAME CONSTRAINT "cs-uil-website_contest_submission_pkey" TO "uil_contest_submission_pkey";
ALTER TABLE "uil_forefeits"          RENAME CONSTRAINT "cs-uil-website_forefeits_pkey"          TO "uil_forefeits_pkey";
ALTER TABLE "uil_permissions"        RENAME CONSTRAINT "cs-uil-website_permissions_pkey"        TO "uil_permissions_pkey";
ALTER TABLE "uil_role"               RENAME CONSTRAINT "cs-uil-website_role_pkey"               TO "uil_role_pkey";
ALTER TABLE "uil_role_permissions"   RENAME CONSTRAINT "cs-uil-website_role_permissions_role_id_permission_id_pk" TO "uil_role_permissions_role_id_permission_id_pk";
ALTER TABLE "uil_session"            RENAME CONSTRAINT "cs-uil-website_session_pkey"            TO "uil_session_pkey";
ALTER TABLE "uil_submission"         RENAME CONSTRAINT "cs-uil-website_submission_pkey"         TO "uil_submission_pkey";
-- The user PK had inherited the name of the old redundant .unique().
ALTER TABLE "uil_user"               RENAME CONSTRAINT "cs-uil-website_user_id_unique"          TO "uil_user_pkey";
ALTER TABLE "uil_user_roles"         RENAME CONSTRAINT "cs-uil-website_user_roles_userId_roleId_pk" TO "uil_user_roles_userId_roleId_pk";
ALTER TABLE "uil_verification"       RENAME CONSTRAINT "cs-uil-website_verification_pkey"       TO "uil_verification_pkey";
ALTER TABLE "uil_written_tests"      RENAME CONSTRAINT "cs-uil-website_written_tests_pkey"      TO "uil_written_tests_pkey";

-- ── Unique constraints ──────────────────────────────────────────────────────
ALTER TABLE "uil_permissions" RENAME CONSTRAINT "cs-uil-website_permissions_name_unique" TO "uil_permissions_name_unique";
ALTER TABLE "uil_session"     RENAME CONSTRAINT "cs-uil-website_session_token_unique"    TO "uil_session_token_unique";
ALTER TABLE "uil_user"        RENAME CONSTRAINT "cs-uil-website_user_email_unique"       TO "uil_user_email_unique";

-- ── Foreign keys (old names were truncated at 63 chars by Postgres) ────────
ALTER TABLE "uil_account"            RENAME CONSTRAINT "cs-uil-website_account_user_id_cs-uil-website_user_id_fk"        TO "account_user_id_fk";
ALTER TABLE "uil_contest"            RENAME CONSTRAINT "cs-uil-website_contest_createdBy_cs-uil-website_user_id_fk"      TO "contest_created_by_fk";
ALTER TABLE "uil_contest_enrollment" RENAME CONSTRAINT "cs-uil-website_contest_enrollment_contestId_cs-uil-website_cont" TO "contest_enrollment_contest_id_fk";
ALTER TABLE "uil_contest_enrollment" RENAME CONSTRAINT "cs-uil-website_contest_enrollment_userId_cs-uil-website_user_id" TO "contest_enrollment_user_id_fk";
ALTER TABLE "uil_contest_problem"    RENAME CONSTRAINT "cs-uil-website_contest_problem_contestId_cs-uil-website_contest" TO "contest_problem_contest_id_fk";
ALTER TABLE "uil_contest_submission" RENAME CONSTRAINT "cs-uil-website_contest_submission_contestId_cs-uil-website_cont" TO "contest_submission_contest_id_fk";
ALTER TABLE "uil_contest_submission" RENAME CONSTRAINT "cs-uil-website_contest_submission_userId_cs-uil-website_user_id" TO "contest_submission_user_id_fk";
ALTER TABLE "uil_forefeits"          RENAME CONSTRAINT "cs-uil-website_forefeits_userId_cs-uil-website_user_id_fk"       TO "forefeits_user_id_fk";
ALTER TABLE "uil_role_permissions"   RENAME CONSTRAINT "cs-uil-website_role_permissions_permission_id_cs-uil-website_pe" TO "role_permissions_permission_id_fk";
ALTER TABLE "uil_role_permissions"   RENAME CONSTRAINT "cs-uil-website_role_permissions_role_id_cs-uil-website_role_id_" TO "role_permissions_role_id_fk";
ALTER TABLE "uil_session"            RENAME CONSTRAINT "cs-uil-website_session_user_id_cs-uil-website_user_id_fk"        TO "session_user_id_fk";
ALTER TABLE "uil_submission"         RENAME CONSTRAINT "cs-uil-website_submission_userId_cs-uil-website_user_id_fk"      TO "submission_user_id_fk";
ALTER TABLE "uil_user_roles"         RENAME CONSTRAINT "cs-uil-website_user_roles_roleId_cs-uil-website_role_id_fk"      TO "user_roles_role_id_fk";
ALTER TABLE "uil_user_roles"         RENAME CONSTRAINT "cs-uil-website_user_roles_userId_cs-uil-website_user_id_fk"      TO "user_roles_user_id_fk";
ALTER TABLE "uil_written_tests"      RENAME CONSTRAINT "cs-uil-website_written_tests_userId_cs-uil-website_user_id_fk"   TO "written_tests_user_id_fk";

-- ── Mark drizzle/0000_baseline.sql as applied ───────────────────────────────
-- Same table drizzle's migrator creates. It applies any migration whose
-- journal `when` is newer than the latest `created_at` here.
CREATE SCHEMA IF NOT EXISTS "drizzle";
CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
    id SERIAL PRIMARY KEY,
    hash text NOT NULL,
    created_at bigint
);
INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at)
VALUES ('81dea8a2a6a480d8faa7d9b3c8aefb5aec008785f841923827894ea37e01fb53', 1790490003664);
