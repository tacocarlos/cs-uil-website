CREATE TABLE "cs-uil-website_account" (
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
CREATE TABLE "cs-uil-website_session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "cs-uil-website_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "cs-uil-website_user" (
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
	CONSTRAINT "cs-uil-website_user_id_unique" UNIQUE("id"),
	CONSTRAINT "cs-uil-website_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "cs-uil-website_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "cs-uil-website_forefeits" (
	"id" text PRIMARY KEY NOT NULL,
	"problemId" integer NOT NULL,
	"userId" text NOT NULL,
	"forefeitedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cs-uil-website_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	CONSTRAINT "cs-uil-website_permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "cs-uil-website_role_permissions" (
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	CONSTRAINT "cs-uil-website_role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "cs-uil-website_role" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text DEFAULT 'student',
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cs-uil-website_user_roles" (
	"userId" text NOT NULL,
	"roleId" integer NOT NULL,
	CONSTRAINT "cs-uil-website_user_roles_userId_roleId_pk" PRIMARY KEY("userId","roleId")
);
--> statement-breakpoint
CREATE TABLE "cs-uil-website_submission" (
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
CREATE TABLE "cs-uil-website_written_tests" (
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
ALTER TABLE "cs-uil-website_account" ADD CONSTRAINT "cs-uil-website_account_user_id_cs-uil-website_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."cs-uil-website_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cs-uil-website_session" ADD CONSTRAINT "cs-uil-website_session_user_id_cs-uil-website_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."cs-uil-website_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cs-uil-website_forefeits" ADD CONSTRAINT "cs-uil-website_forefeits_userId_cs-uil-website_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."cs-uil-website_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cs-uil-website_role_permissions" ADD CONSTRAINT "cs-uil-website_role_permissions_role_id_cs-uil-website_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."cs-uil-website_role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cs-uil-website_role_permissions" ADD CONSTRAINT "cs-uil-website_role_permissions_permission_id_cs-uil-website_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."cs-uil-website_permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cs-uil-website_user_roles" ADD CONSTRAINT "cs-uil-website_user_roles_userId_cs-uil-website_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."cs-uil-website_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cs-uil-website_user_roles" ADD CONSTRAINT "cs-uil-website_user_roles_roleId_cs-uil-website_role_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."cs-uil-website_role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cs-uil-website_submission" ADD CONSTRAINT "cs-uil-website_submission_userId_cs-uil-website_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."cs-uil-website_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cs-uil-website_written_tests" ADD CONSTRAINT "cs-uil-website_written_tests_userId_cs-uil-website_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."cs-uil-website_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "u_idx" ON "cs-uil-website_forefeits" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "p_idx" ON "cs-uil-website_forefeits" USING btree ("problemId");--> statement-breakpoint
CREATE INDEX "problem_idx" ON "cs-uil-website_submission" USING btree ("problemId");--> statement-breakpoint
CREATE INDEX "user_idx" ON "cs-uil-website_submission" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "written_tests_user_idx" ON "cs-uil-website_written_tests" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "written_tests_competition_idx" ON "cs-uil-website_written_tests" USING btree ("competition");