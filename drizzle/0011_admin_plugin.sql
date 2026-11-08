ALTER TABLE "uil_session" ADD COLUMN "impersonated_by" text;--> statement-breakpoint
ALTER TABLE "uil_user" ADD COLUMN "banned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "uil_user" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "uil_user" ADD COLUMN "ban_expires" timestamp;