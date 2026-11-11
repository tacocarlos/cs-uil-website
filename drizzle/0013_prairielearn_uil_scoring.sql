ALTER TABLE "uil_prairielearn_attempt" ADD COLUMN "correct" integer;--> statement-breakpoint
ALTER TABLE "uil_prairielearn_attempt" ADD COLUMN "wrong" integer;--> statement-breakpoint
ALTER TABLE "uil_prairielearn_attempt" ADD COLUMN "skipped" integer;--> statement-breakpoint
ALTER TABLE "uil_prairielearn_attempt" DROP COLUMN "score_perc";
