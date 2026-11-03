CREATE TABLE "uil_problem_run" (
	"userId" text NOT NULL,
	"problemId" integer NOT NULL,
	"firstRunAt" timestamp DEFAULT now() NOT NULL,
	"lastRunAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uil_problem_run_userId_problemId_pk" PRIMARY KEY("userId","problemId")
);
--> statement-breakpoint
ALTER TABLE "uil_problem_run" ADD CONSTRAINT "problem_run_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."uil_user"("id") ON DELETE cascade ON UPDATE no action;