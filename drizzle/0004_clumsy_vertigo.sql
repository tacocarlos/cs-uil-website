CREATE TABLE "cs-uil-website_forefeits" (
	"id" text PRIMARY KEY NOT NULL,
	"problemId" integer NOT NULL,
	"userId" text NOT NULL,
	"forefeitedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cs-uil-website_forefeits_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "cs-uil-website_forefeits" ADD CONSTRAINT "cs-uil-website_forefeits_problemId_cs-uil-website_problems_id_fk" FOREIGN KEY ("problemId") REFERENCES "public"."cs-uil-website_problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cs-uil-website_forefeits" ADD CONSTRAINT "cs-uil-website_forefeits_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "u_idx" ON "cs-uil-website_forefeits" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "p_idx" ON "cs-uil-website_forefeits" USING btree ("problemId");