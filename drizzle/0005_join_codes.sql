ALTER TABLE "uil_organization" ADD COLUMN "join_code" text;--> statement-breakpoint
ALTER TABLE "uil_organization" ADD CONSTRAINT "uil_organization_join_code_unique" UNIQUE("join_code");