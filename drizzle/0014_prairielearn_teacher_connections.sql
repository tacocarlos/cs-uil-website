ALTER TABLE "uil_prairielearn_course" ALTER COLUMN "course_instance_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "uil_prairielearn_course" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "uil_prairielearn_course" ADD COLUMN "server_url" text;--> statement-breakpoint
ALTER TABLE "uil_prairielearn_course" ADD COLUMN "encrypted_token" text;--> statement-breakpoint
ALTER TABLE "uil_prairielearn_course" ADD COLUMN "connected_by" text;--> statement-breakpoint
ALTER TABLE "uil_prairielearn_course" ADD COLUMN "connected_at" timestamp;--> statement-breakpoint
ALTER TABLE "uil_prairielearn_course" ADD CONSTRAINT "prairielearn_course_connected_by_fk" FOREIGN KEY ("connected_by") REFERENCES "public"."uil_user"("id") ON DELETE set null ON UPDATE no action;