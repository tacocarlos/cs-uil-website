CREATE TABLE "cs-uil-website_written_tests" (
	"userId" text NOT NULL,
	"competition" text,
	"score" integer NOT NULL,
	"takenAt" date DEFAULT now() NOT NULL,
	"accuracy" real DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cs-uil-website_written_tests" ADD CONSTRAINT "cs-uil-website_written_tests_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "written_tests_user_idx" ON "cs-uil-website_written_tests" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "written_tests_competition_idx" ON "cs-uil-website_written_tests" USING btree ("competition");