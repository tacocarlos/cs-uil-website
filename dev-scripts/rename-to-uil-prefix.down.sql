-- Reverses rename-to-uil-prefix.sql. Generated from it; keep them in sync.
-- Run: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction -f dev-scripts/rename-to-uil-prefix.down.sql

-- Constraints first, while tables still have their uil_ names.
ALTER TABLE "uil_account" RENAME CONSTRAINT "uil_account_pkey" TO "cs-uil-website_account_pkey";
ALTER TABLE "uil_contest" RENAME CONSTRAINT "uil_contest_pkey" TO "cs-uil-website_contest_pkey";
ALTER TABLE "uil_contest_enrollment" RENAME CONSTRAINT "uil_contest_enrollment_pkey" TO "cs-uil-website_contest_enrollment_pkey";
ALTER TABLE "uil_contest_problem" RENAME CONSTRAINT "uil_contest_problem_pkey" TO "cs-uil-website_contest_problem_pkey";
ALTER TABLE "uil_contest_submission" RENAME CONSTRAINT "uil_contest_submission_pkey" TO "cs-uil-website_contest_submission_pkey";
ALTER TABLE "uil_forefeits" RENAME CONSTRAINT "uil_forefeits_pkey" TO "cs-uil-website_forefeits_pkey";
ALTER TABLE "uil_permissions" RENAME CONSTRAINT "uil_permissions_pkey" TO "cs-uil-website_permissions_pkey";
ALTER TABLE "uil_role" RENAME CONSTRAINT "uil_role_pkey" TO "cs-uil-website_role_pkey";
ALTER TABLE "uil_role_permissions" RENAME CONSTRAINT "uil_role_permissions_role_id_permission_id_pk" TO "cs-uil-website_role_permissions_role_id_permission_id_pk";
ALTER TABLE "uil_session" RENAME CONSTRAINT "uil_session_pkey" TO "cs-uil-website_session_pkey";
ALTER TABLE "uil_submission" RENAME CONSTRAINT "uil_submission_pkey" TO "cs-uil-website_submission_pkey";
ALTER TABLE "uil_user" RENAME CONSTRAINT "uil_user_pkey" TO "cs-uil-website_user_id_unique";
ALTER TABLE "uil_user_roles" RENAME CONSTRAINT "uil_user_roles_userId_roleId_pk" TO "cs-uil-website_user_roles_userId_roleId_pk";
ALTER TABLE "uil_verification" RENAME CONSTRAINT "uil_verification_pkey" TO "cs-uil-website_verification_pkey";
ALTER TABLE "uil_written_tests" RENAME CONSTRAINT "uil_written_tests_pkey" TO "cs-uil-website_written_tests_pkey";
ALTER TABLE "uil_permissions" RENAME CONSTRAINT "uil_permissions_name_unique" TO "cs-uil-website_permissions_name_unique";
ALTER TABLE "uil_session" RENAME CONSTRAINT "uil_session_token_unique" TO "cs-uil-website_session_token_unique";
ALTER TABLE "uil_user" RENAME CONSTRAINT "uil_user_email_unique" TO "cs-uil-website_user_email_unique";
ALTER TABLE "uil_account" RENAME CONSTRAINT "account_user_id_fk" TO "cs-uil-website_account_user_id_cs-uil-website_user_id_fk";
ALTER TABLE "uil_contest" RENAME CONSTRAINT "contest_created_by_fk" TO "cs-uil-website_contest_createdBy_cs-uil-website_user_id_fk";
ALTER TABLE "uil_contest_enrollment" RENAME CONSTRAINT "contest_enrollment_contest_id_fk" TO "cs-uil-website_contest_enrollment_contestId_cs-uil-website_cont";
ALTER TABLE "uil_contest_enrollment" RENAME CONSTRAINT "contest_enrollment_user_id_fk" TO "cs-uil-website_contest_enrollment_userId_cs-uil-website_user_id";
ALTER TABLE "uil_contest_problem" RENAME CONSTRAINT "contest_problem_contest_id_fk" TO "cs-uil-website_contest_problem_contestId_cs-uil-website_contest";
ALTER TABLE "uil_contest_submission" RENAME CONSTRAINT "contest_submission_contest_id_fk" TO "cs-uil-website_contest_submission_contestId_cs-uil-website_cont";
ALTER TABLE "uil_contest_submission" RENAME CONSTRAINT "contest_submission_user_id_fk" TO "cs-uil-website_contest_submission_userId_cs-uil-website_user_id";
ALTER TABLE "uil_forefeits" RENAME CONSTRAINT "forefeits_user_id_fk" TO "cs-uil-website_forefeits_userId_cs-uil-website_user_id_fk";
ALTER TABLE "uil_role_permissions" RENAME CONSTRAINT "role_permissions_permission_id_fk" TO "cs-uil-website_role_permissions_permission_id_cs-uil-website_pe";
ALTER TABLE "uil_role_permissions" RENAME CONSTRAINT "role_permissions_role_id_fk" TO "cs-uil-website_role_permissions_role_id_cs-uil-website_role_id_";
ALTER TABLE "uil_session" RENAME CONSTRAINT "session_user_id_fk" TO "cs-uil-website_session_user_id_cs-uil-website_user_id_fk";
ALTER TABLE "uil_submission" RENAME CONSTRAINT "submission_user_id_fk" TO "cs-uil-website_submission_userId_cs-uil-website_user_id_fk";
ALTER TABLE "uil_user_roles" RENAME CONSTRAINT "user_roles_role_id_fk" TO "cs-uil-website_user_roles_roleId_cs-uil-website_role_id_fk";
ALTER TABLE "uil_user_roles" RENAME CONSTRAINT "user_roles_user_id_fk" TO "cs-uil-website_user_roles_userId_cs-uil-website_user_id_fk";
ALTER TABLE "uil_written_tests" RENAME CONSTRAINT "written_tests_user_id_fk" TO "cs-uil-website_written_tests_userId_cs-uil-website_user_id_fk";

ALTER SEQUENCE "uil_contest_id_seq" RENAME TO "cs-uil-website_contest_id_seq";
ALTER SEQUENCE "uil_contest_enrollment_id_seq" RENAME TO "cs-uil-website_contest_enrollment_id_seq";
ALTER SEQUENCE "uil_contest_problem_id_seq" RENAME TO "cs-uil-website_contest_problem_id_seq";
ALTER SEQUENCE "uil_permissions_id_seq" RENAME TO "cs-uil-website_permissions_id_seq";
ALTER SEQUENCE "uil_role_id_seq" RENAME TO "cs-uil-website_role_id_seq";

ALTER TABLE "uil_account" RENAME TO "cs-uil-website_account";
ALTER TABLE "uil_contest" RENAME TO "cs-uil-website_contest";
ALTER TABLE "uil_contest_enrollment" RENAME TO "cs-uil-website_contest_enrollment";
ALTER TABLE "uil_contest_problem" RENAME TO "cs-uil-website_contest_problem";
ALTER TABLE "uil_contest_submission" RENAME TO "cs-uil-website_contest_submission";
ALTER TABLE "uil_forefeits" RENAME TO "cs-uil-website_forefeits";
ALTER TABLE "uil_permissions" RENAME TO "cs-uil-website_permissions";
ALTER TABLE "uil_role" RENAME TO "cs-uil-website_role";
ALTER TABLE "uil_role_permissions" RENAME TO "cs-uil-website_role_permissions";
ALTER TABLE "uil_session" RENAME TO "cs-uil-website_session";
ALTER TABLE "uil_submission" RENAME TO "cs-uil-website_submission";
ALTER TABLE "uil_user" RENAME TO "cs-uil-website_user";
ALTER TABLE "uil_user_roles" RENAME TO "cs-uil-website_user_roles";
ALTER TABLE "uil_verification" RENAME TO "cs-uil-website_verification";
ALTER TABLE "uil_written_tests" RENAME TO "cs-uil-website_written_tests";

DELETE FROM "drizzle"."__drizzle_migrations" WHERE hash = '81dea8a2a6a480d8faa7d9b3c8aefb5aec008785f841923827894ea37e01fb53';
