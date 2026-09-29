DROP TABLE "uil_permissions" CASCADE;--> statement-breakpoint
DROP TABLE "uil_role_permissions" CASCADE;--> statement-breakpoint
DROP TABLE "uil_role" CASCADE;--> statement-breakpoint
DROP TABLE "uil_user_roles" CASCADE;--> statement-breakpoint
ALTER TABLE "uil_user" ADD COLUMN "showInGlobalLeaderboard" boolean DEFAULT false NOT NULL;