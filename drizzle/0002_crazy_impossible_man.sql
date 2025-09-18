ALTER TABLE "cs-uil-website_submission" ALTER COLUMN "isStudentVisible" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "showScoresInLeaderboard" boolean DEFAULT true NOT NULL;