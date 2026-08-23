CREATE TABLE "cs-uil-website_contest" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"startsAt" timestamp NOT NULL,
	"endsAt" timestamp NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"createdBy" text NOT NULL,
	"scoringMode" text DEFAULT 'simple' NOT NULL,
	"penaltyPoints" integer DEFAULT 20 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cs-uil-website_contest_enrollment" (
	"id" serial PRIMARY KEY NOT NULL,
	"contestId" integer NOT NULL,
	"userId" text NOT NULL,
	"enrolledAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cs-uil-website_contest_problem" (
	"id" serial PRIMARY KEY NOT NULL,
	"contestId" integer NOT NULL,
	"apiProblemId" integer NOT NULL,
	"label" text NOT NULL,
	"maxPoints" integer DEFAULT 60 NOT NULL,
	"displayOrder" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cs-uil-website_contest_submission" (
	"id" text PRIMARY KEY NOT NULL,
	"contestId" integer NOT NULL,
	"apiProblemId" integer NOT NULL,
	"userId" text NOT NULL,
	"languageId" text NOT NULL,
	"submittedCode" text NOT NULL,
	"accepted" boolean DEFAULT false NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"attemptNumber" integer DEFAULT 1 NOT NULL,
	"submittedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cs-uil-website_contest" ADD CONSTRAINT "cs-uil-website_contest_createdBy_cs-uil-website_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."cs-uil-website_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cs-uil-website_contest_enrollment" ADD CONSTRAINT "cs-uil-website_contest_enrollment_contestId_cs-uil-website_contest_id_fk" FOREIGN KEY ("contestId") REFERENCES "public"."cs-uil-website_contest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cs-uil-website_contest_enrollment" ADD CONSTRAINT "cs-uil-website_contest_enrollment_userId_cs-uil-website_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."cs-uil-website_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cs-uil-website_contest_problem" ADD CONSTRAINT "cs-uil-website_contest_problem_contestId_cs-uil-website_contest_id_fk" FOREIGN KEY ("contestId") REFERENCES "public"."cs-uil-website_contest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cs-uil-website_contest_submission" ADD CONSTRAINT "cs-uil-website_contest_submission_contestId_cs-uil-website_contest_id_fk" FOREIGN KEY ("contestId") REFERENCES "public"."cs-uil-website_contest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cs-uil-website_contest_submission" ADD CONSTRAINT "cs-uil-website_contest_submission_userId_cs-uil-website_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."cs-uil-website_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ce_contest_idx" ON "cs-uil-website_contest_enrollment" USING btree ("contestId");--> statement-breakpoint
CREATE INDEX "ce_user_idx" ON "cs-uil-website_contest_enrollment" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "cp_contest_idx" ON "cs-uil-website_contest_problem" USING btree ("contestId");--> statement-breakpoint
CREATE INDEX "cs_contest_idx" ON "cs-uil-website_contest_submission" USING btree ("contestId");--> statement-breakpoint
CREATE INDEX "cs_user_idx" ON "cs-uil-website_contest_submission" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "cs_problem_idx" ON "cs-uil-website_contest_submission" USING btree ("apiProblemId");