ALTER TABLE "uil_user" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "uil_user" ADD COLUMN "display_username" text;--> statement-breakpoint
ALTER TABLE "uil_user" ADD CONSTRAINT "uil_user_username_unique" UNIQUE("username");