import { sql } from "drizzle-orm";
import { check, foreignKey, index, primaryKey } from "drizzle-orm/pg-core";
import createTable, { cascadeFk } from "./createTable";
import { user } from "./auth";
import { organization } from "./organization";
import { randomUUID } from "crypto";
import { CONTEST_STATUSES } from "~/lib/contest/status";
import { DEFAULT_MAX_POINTS } from "~/lib/problems/scoring";
import {
    CONTEST_VISIBILITIES,
    type ContestVisibility,
} from "~/lib/contest/visibility";

export { CONTEST_VISIBILITIES, type ContestVisibility };

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
        status: d.text({ enum: CONTEST_STATUSES }).notNull().default("draft"),
        createdBy: d.text().notNull(),
        /** simple = first accepted wins full points; penalty = ICPC-style deductions */
        scoringMode: d
            .text({ enum: ["simple", "penalty"] })
            .notNull()
            .default("simple"),
        /** Points deducted per wrong attempt in penalty mode */
        penaltyPoints: d.integer().notNull().default(20),
        createdAt: d.timestamp().defaultNow().notNull(),
        /**
         * The hosting school, whose teachers manage the contest (site admins
         * manage every contest). Null exactly for global contests.
         */
        organizationId: d.text(),
        /**
         * school = the host school's members; invite = also members of
         * invited schools that haven't declined (contest_invite); open =
         * a global contest for everyone, created by site admins.
         */
        visibility: d
            .text({ enum: CONTEST_VISIBILITIES })
            .notNull()
            .default("school"),
    }),
    (t) => [
        index("contest_organization_idx").on(t.organizationId),
        // Global (open) contests have no host; every other contest has one.
        check(
            "contest_host_check",
            sql`(${t.visibility} = 'open') = (${t.organizationId} IS NULL)`,
        ),
        cascadeFk("contest_created_by_fk", t.createdBy, user.id),
        cascadeFk(
            "contest_organization_id_fk",
            t.organizationId,
            organization.id,
        ),
    ],
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
        maxPoints: d.integer().notNull().default(DEFAULT_MAX_POINTS),
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
        /**
         * The school the student competes for, shown on the leaderboard.
         * Null in open contests for students without a school.
         */
        organizationId: d.text(),
    }),
    (t) => [
        index("ce_contest_idx").on(t.contestId),
        index("ce_user_idx").on(t.userId),
        cascadeFk("contest_enrollment_contest_id_fk", t.contestId, contest.id),
        cascadeFk("contest_enrollment_user_id_fk", t.userId, user.id),
        // Deleting a school keeps its students' results, without a school.
        foreignKey({
            name: "contest_enrollment_organization_id_fk",
            columns: [t.organizationId],
            foreignColumns: [organization.id],
        }).onDelete("set null"),
    ],
);

export type ContestEnrollment = typeof contestEnrollment.$inferSelect;

// ── contest_invite ────────────────────────────────────────────────────────────

/** Schools invited to an invite-only contest, besides the host. */
export const contestInvite = createTable(
    "contest_invite",
    (d) => ({
        contestId: d.integer().notNull(),
        organizationId: d.text().notNull(),
        /**
         * When the invited school's teachers declined; null while the
         * invitation stands. Declined schools can't see or join the
         * contest (students already enrolled keep their results).
         */
        declinedAt: d.timestamp(),
    }),
    (t) => [
        primaryKey({ columns: [t.contestId, t.organizationId] }),
        index("contest_invite_organization_idx").on(t.organizationId),
        cascadeFk("contest_invite_contest_id_fk", t.contestId, contest.id),
        cascadeFk(
            "contest_invite_organization_id_fk",
            t.organizationId,
            organization.id,
        ),
    ],
);

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
