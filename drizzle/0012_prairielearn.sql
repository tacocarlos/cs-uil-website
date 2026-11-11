CREATE TABLE "uil_prairielearn_assessment" (
	"organization_id" text NOT NULL,
	"assessment_id" text NOT NULL,
	"level" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "prairielearn_assessment_pk" PRIMARY KEY("organization_id","assessment_id")
);
--> statement-breakpoint
CREATE TABLE "uil_prairielearn_attempt" (
	"organization_id" text NOT NULL,
	"assessment_instance_id" text NOT NULL,
	"assessment_id" text NOT NULL,
	"prairielearn_user_id" text NOT NULL,
	"points" double precision NOT NULL,
	"max_points" double precision NOT NULL,
	"score_perc" double precision NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"open" boolean NOT NULL,
	CONSTRAINT "prairielearn_attempt_pk" PRIMARY KEY("organization_id","assessment_instance_id")
);
--> statement-breakpoint
CREATE TABLE "uil_prairielearn_course" (
	"organization_id" text PRIMARY KEY NOT NULL,
	"course_instance_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"synced_at" timestamp,
	"sync_error" text
);
--> statement-breakpoint
CREATE TABLE "uil_prairielearn_user" (
	"organization_id" text NOT NULL,
	"prairielearn_user_id" text NOT NULL,
	"uid" text NOT NULL,
	"name" text,
	"user_id" text,
	"linked_by_teacher" boolean DEFAULT false NOT NULL,
	CONSTRAINT "prairielearn_user_pk" PRIMARY KEY("organization_id","prairielearn_user_id")
);
--> statement-breakpoint
ALTER TABLE "uil_prairielearn_assessment" ADD CONSTRAINT "prairielearn_assessment_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."uil_prairielearn_course"("organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uil_prairielearn_attempt" ADD CONSTRAINT "prairielearn_attempt_assessment_fk" FOREIGN KEY ("organization_id","assessment_id") REFERENCES "public"."uil_prairielearn_assessment"("organization_id","assessment_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uil_prairielearn_attempt" ADD CONSTRAINT "prairielearn_attempt_user_fk" FOREIGN KEY ("organization_id","prairielearn_user_id") REFERENCES "public"."uil_prairielearn_user"("organization_id","prairielearn_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uil_prairielearn_course" ADD CONSTRAINT "prairielearn_course_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."uil_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uil_prairielearn_user" ADD CONSTRAINT "prairielearn_user_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."uil_prairielearn_course"("organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uil_prairielearn_user" ADD CONSTRAINT "prairielearn_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."uil_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "prairielearn_attempt_assessment_idx" ON "uil_prairielearn_attempt" USING btree ("organization_id","assessment_id");--> statement-breakpoint
CREATE INDEX "prairielearn_user_user_idx" ON "uil_prairielearn_user" USING btree ("user_id");