CREATE TABLE "uil_featureRequest" (
	"id" serial PRIMARY KEY NOT NULL,
	"deletedAt" timestamp,
	"timeSubmitted" timestamp DEFAULT now() NOT NULL,
	"featureStatus" text DEFAULT 'pending' NOT NULL,
	"userId" text NOT NULL,
	"message" text NOT NULL,
	"adminResponse" text,
	"category" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "uil_featureRequest" ADD CONSTRAINT "feat_req_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."uil_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feat_req_user_idx" ON "uil_featureRequest" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "feat_req_cat_idx" ON "uil_featureRequest" USING btree ("category");--> statement-breakpoint
CREATE INDEX "feat_req_status_idx" ON "uil_featureRequest" USING btree ("featureStatus");