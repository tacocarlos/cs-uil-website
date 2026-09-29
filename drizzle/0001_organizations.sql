CREATE TABLE "uil_invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uil_member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "member_organization_user_unique" UNIQUE("organization_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "uil_organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text,
	CONSTRAINT "uil_organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "uil_session" ADD COLUMN "active_organization_id" text;--> statement-breakpoint
ALTER TABLE "uil_invitation" ADD CONSTRAINT "invitation_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."uil_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uil_invitation" ADD CONSTRAINT "invitation_inviter_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."uil_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uil_member" ADD CONSTRAINT "member_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."uil_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uil_member" ADD CONSTRAINT "member_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."uil_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "member_user_idx" ON "uil_member" USING btree ("user_id");