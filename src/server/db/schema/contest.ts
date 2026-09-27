import { index } from "drizzle-orm/pg-core";
import createTable, { cascadeFk } from "./createTable";
import { user } from "./auth";
import { randomUUID } from "crypto";

// ── contest ───────────────────────────────────────────────────────────────────

export const contest = createTable(
    "contest",
    (d) => ({
        id: d.serial().primaryKey(),
        name: d.text().notNull(),
        description: d.text().notNull().default(""),
        startsAt: d.timestamp().notNull(),
        endsAt: d.timestamp().notNull(),
        /** draft → scheduled → active → frozen → ended */
        status: d
            .text({
                enum: ["draft", "scheduled", "active", "frozen", "ended"],
            })
            .notNull()
            .default("draft"),
        createdBy: d.text().notNull(),
        /** simple = first accepted wins full points; penalty = ICPC-style deductions */
        scoringMode: d
            .text({ enum: ["simple", "penalty"] })
            .notNull()
            .default("simple"),
        /** Points deducted per wrong attempt in penalty mode */
        penaltyPoints: d.integer().notNull().default(20),
        createdAt: d.timestamp().defaultNow().notNull(),
    }),
    (t) => [cascadeFk("contest_created_by_fk", t.createdBy, user.id)],
);

export type Contest = typeof contest.$inferSelect;
export type ContestStatus = Contest["status"];
export type ScoringMode = Contest["scoringMode"];

// ── contest_problem ───────────────────────────────────────────────────────────

export const contestProblem = createTable(
    "contest_problem",
    (d) => ({
        id: d.serial().primaryKey(),
        contestId: d.integer().notNull(),
        /** ID from https://api.lunaghs.dev — not a FK to the removed local table */
        apiProblemId: d.integer().notNull(),
        /** Teacher-assigned label shown to students, e.g. "A", "B", "Sorting" */
        label: d.text().notNull(),
        maxPoints: d.integer().notNull().default(60),
        displayOrder: d.integer().notNull().default(0),
    }),
    (t) => [
        index("cp_contest_idx").on(t.contestId),
        cascadeFk("contest_problem_contest_id_fk", t.contestId, contest.id),
    ],
);

export type ContestProblem = typeof contestProblem.$inferSelect;

// ── contest_enrollment ────────────────────────────────────────────────────────

export const contestEnrollment = createTable(
    "contest_enrollment",
    (d) => ({
        id: d.serial().primaryKey(),
        contestId: d.integer().notNull(),
        userId: d.text().notNull(),
        enrolledAt: d.timestamp().defaultNow().notNull(),
    }),
    (t) => [
        index("ce_contest_idx").on(t.contestId),
        index("ce_user_idx").on(t.userId),
        cascadeFk("contest_enrollment_contest_id_fk", t.contestId, contest.id),
        cascadeFk("contest_enrollment_user_id_fk", t.userId, user.id),
    ],
);

export type ContestEnrollment = typeof contestEnrollment.$inferSelect;

// ── contest_submission ────────────────────────────────────────────────────────

export const contestSubmission = createTable(
    "contest_submission",
    (d) => ({
        id: d.text().primaryKey().$defaultFn(randomUUID),
        contestId: d.integer().notNull(),
        apiProblemId: d.integer().notNull(),
        userId: d.text().notNull(),
        languageId: d.text().notNull(),
        submittedCode: d.text().notNull(),
        accepted: d.boolean().notNull().default(false),
        points: d.integer().notNull().default(0),
        attemptNumber: d.integer().notNull().default(1),
        submittedAt: d.timestamp().defaultNow().notNull(),
    }),
    (t) => [
        index("cs_contest_idx").on(t.contestId),
        index("cs_user_idx").on(t.userId),
        index("cs_problem_idx").on(t.apiProblemId),
        cascadeFk("contest_submission_contest_id_fk", t.contestId, contest.id),
        cascadeFk("contest_submission_user_id_fk", t.userId, user.id),
    ],
);

export type ContestSubmission = typeof contestSubmission.$inferSelect;
