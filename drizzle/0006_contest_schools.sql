CREATE TABLE "uil_contest_invite" (
	"contestId" integer NOT NULL,
	"organizationId" text NOT NULL,
	CONSTRAINT "uil_contest_invite_contestId_organizationId_pk" PRIMARY KEY("contestId","organizationId")
);
--> statement-breakpoint
-- Existing contests belong to the default school (DEFAULT_ORGANIZATION in
-- src/lib/auth/organizations.ts); add the column empty, fill it, then
-- require it.
ALTER TABLE "uil_contest" ADD COLUMN "organizationId" text;--> statement-breakpoint
UPDATE "uil_contest" SET "organizationId" = 'groveton-hs';--> statement-breakpoint
ALTER TABLE "uil_contest" ALTER COLUMN "organizationId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "uil_contest" ADD COLUMN "visibility" text DEFAULT 'school' NOT NULL;--> statement-breakpoint
ALTER TABLE "uil_contest_enrollment" ADD COLUMN "organizationId" text;--> statement-breakpoint
-- Existing enrollments compete for the student's earliest school.
UPDATE "uil_contest_enrollment" e
SET "organizationId" = (
	SELECT m."organization_id" FROM "uil_member" m
	WHERE m."user_id" = e."userId"
	ORDER BY m."created_at"
	LIMIT 1
);--> statement-breakpoint
ALTER TABLE "uil_contest_invite" ADD CONSTRAINT "contest_invite_contest_id_fk" FOREIGN KEY ("contestId") REFERENCES "public"."uil_contest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uil_contest_invite" ADD CONSTRAINT "contest_invite_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."uil_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contest_invite_organization_idx" ON "uil_contest_invite" USING btree ("organizationId");--> statement-breakpoint
ALTER TABLE "uil_contest" ADD CONSTRAINT "contest_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."uil_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uil_contest_enrollment" ADD CONSTRAINT "contest_enrollment_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."uil_organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contest_organization_idx" ON "uil_contest" USING btree ("organizationId");