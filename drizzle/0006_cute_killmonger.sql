ALTER TABLE "user" DROP CONSTRAINT "user_mostRecentProblem_cs-uil-website_problems_id_fk";
--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_mostRecentProblem_cs-uil-website_problems_id_fk" FOREIGN KEY ("mostRecentProblem") REFERENCES "public"."cs-uil-website_problems"("id") ON DELETE set null ON UPDATE no action;