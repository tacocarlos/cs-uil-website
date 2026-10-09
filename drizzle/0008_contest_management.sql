ALTER TABLE "uil_contest" ALTER COLUMN "organizationId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "uil_contest_invite" ADD COLUMN "declinedAt" timestamp;--> statement-breakpoint
-- Open contests are now global contests, which have no host school.
UPDATE "uil_contest" SET "organizationId" = NULL WHERE "visibility" = 'open';--> statement-breakpoint
ALTER TABLE "uil_contest" ADD CONSTRAINT "contest_host_check" CHECK (("uil_contest"."visibility" = 'open') = ("uil_contest"."organizationId" IS NULL));