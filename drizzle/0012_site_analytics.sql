CREATE TABLE "uil_auth_event" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"method" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uil_user_activity" (
	"userId" text NOT NULL,
	"day" date NOT NULL,
	CONSTRAINT "user_activity_pk" PRIMARY KEY("userId","day")
);
--> statement-breakpoint
-- IF NOT EXISTS: an earlier, discarded migration added this column on some databases.
ALTER TABLE "uil_user" ADD COLUMN IF NOT EXISTS "last_active_at" timestamp;--> statement-breakpoint
ALTER TABLE "uil_auth_event" ADD CONSTRAINT "auth_event_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."uil_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uil_user_activity" ADD CONSTRAINT "user_activity_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."uil_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_event_type_created_idx" ON "uil_auth_event" USING btree ("type","createdAt");--> statement-breakpoint
CREATE INDEX "auth_event_user_idx" ON "uil_auth_event" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "user_activity_day_idx" ON "uil_user_activity" USING btree ("day");