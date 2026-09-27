CREATE TABLE "uil_account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uil_session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "uil_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "uil_user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"showSubmissionScores" boolean DEFAULT true NOT NULL,
	"role" text DEFAULT 'student',
	"showScoresInLeaderboard" boolean DEFAULT true NOT NULL,
	CONSTRAINT "uil_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "uil_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "uil_contest" (
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
CREATE TABLE "uil_contest_enrollment" (
	"id" serial PRIMARY KEY NOT NULL,
	"contestId" integer NOT NULL,
	"userId" text NOT NULL,
	"enrolledAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uil_contest_problem" (
	"id" serial PRIMARY KEY NOT NULL,
	"contestId" integer NOT NULL,
	"apiProblemId" integer NOT NULL,
	"label" text NOT NULL,
	"maxPoints" integer DEFAULT 60 NOT NULL,
	"displayOrder" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uil_contest_submission" (
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
CREATE TABLE "uil_forefeits" (
	"id" text PRIMARY KEY NOT NULL,
	"problemId" integer NOT NULL,
	"userId" text NOT NULL,
	"forefeitedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uil_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	CONSTRAINT "uil_permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "uil_role_permissions" (
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	CONSTRAINT "uil_role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "uil_role" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text DEFAULT 'student',
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uil_user_roles" (
	"userId" text NOT NULL,
	"roleId" integer NOT NULL,
	CONSTRAINT "uil_user_roles_userId_roleId_pk" PRIMARY KEY("userId","roleId")
);
--> statement-breakpoint
CREATE TABLE "uil_submission" (
	"id" text PRIMARY KEY NOT NULL,
	"problemId" integer NOT NULL,
	"userId" text NOT NULL,
	"timeSubmitted" timestamp DEFAULT now() NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"maxPoints" integer DEFAULT 60 NOT NULL,
	"accepted" boolean DEFAULT false,
	"submittedCode" text NOT NULL,
	"isStudentVisible" boolean DEFAULT true NOT NULL,
	"attemptNumber" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uil_written_tests" (
	"id" text PRIMARY KEY NOT NULL,
	"adminShow" boolean DEFAULT false,
	"userId" text NOT NULL,
	"competition" text,
	"seasonYear" integer DEFAULT 2000 NOT NULL,
	"score" integer NOT NULL,
	"takenAt" date DEFAULT now() NOT NULL,
	"accuracy" real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "uil_account" ADD CONSTRAINT "account_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."uil_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uil_session" ADD CONSTRAINT "session_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."uil_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uil_contest" ADD CONSTRAINT "contest_created_by_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."uil_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uil_contest_enrollment" ADD CONSTRAINT "contest_enrollment_contest_id_fk" FOREIGN KEY ("contestId") REFERENCES "public"."uil_contest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uil_contest_enrollment" ADD CONSTRAINT "contest_enrollment_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."uil_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uil_contest_problem" ADD CONSTRAINT "contest_problem_contest_id_fk" FOREIGN KEY ("contestId") REFERENCES "public"."uil_contest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uil_contest_submission" ADD CONSTRAINT "contest_submission_contest_id_fk" FOREIGN KEY ("contestId") REFERENCES "public"."uil_contest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uil_contest_submission" ADD CONSTRAINT "contest_submission_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."uil_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uil_forefeits" ADD CONSTRAINT "forefeits_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."uil_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uil_role_permissions" ADD CONSTRAINT "role_permissions_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."uil_role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uil_role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."uil_permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uil_user_roles" ADD CONSTRAINT "user_roles_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."uil_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uil_user_roles" ADD CONSTRAINT "user_roles_role_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."uil_role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uil_submission" ADD CONSTRAINT "submission_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."uil_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uil_written_tests" ADD CONSTRAINT "written_tests_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."uil_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ce_contest_idx" ON "uil_contest_enrollment" USING btree ("contestId");--> statement-breakpoint
CREATE INDEX "ce_user_idx" ON "uil_contest_enrollment" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "cp_contest_idx" ON "uil_contest_problem" USING btree ("contestId");--> statement-breakpoint
CREATE INDEX "cs_contest_idx" ON "uil_contest_submission" USING btree ("contestId");--> statement-breakpoint
CREATE INDEX "cs_user_idx" ON "uil_contest_submission" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "cs_problem_idx" ON "uil_contest_submission" USING btree ("apiProblemId");--> statement-breakpoint
CREATE INDEX "u_idx" ON "uil_forefeits" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "p_idx" ON "uil_forefeits" USING btree ("problemId");--> statement-breakpoint
CREATE INDEX "problem_idx" ON "uil_submission" USING btree ("problemId");--> statement-breakpoint
CREATE INDEX "user_idx" ON "uil_submission" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "written_tests_user_idx" ON "uil_written_tests" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "written_tests_competition_idx" ON "uil_written_tests" USING btree ("competition");