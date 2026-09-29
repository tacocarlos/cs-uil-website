ALTER TABLE "uil_organization" ADD COLUMN "conference" text;--> statement-breakpoint
ALTER TABLE "uil_organization" ADD COLUMN "district" integer;--> statement-breakpoint
ALTER TABLE "uil_organization" ADD COLUMN "region" integer;--> statement-breakpoint
CREATE INDEX "organization_conference_idx" ON "uil_organization" USING btree ("conference");--> statement-breakpoint
ALTER TABLE "uil_organization" ADD CONSTRAINT "organization_conference_check" CHECK ("uil_organization"."conference" IN ('1A', '2A', '3A', '4A', '5A', '6A'));--> statement-breakpoint
ALTER TABLE "uil_organization" ADD CONSTRAINT "organization_district_check" CHECK ("uil_organization"."district" BETWEEN 1 AND 32);--> statement-breakpoint
ALTER TABLE "uil_organization" ADD CONSTRAINT "organization_region_check" CHECK ("uil_organization"."region" BETWEEN 1 AND 4);