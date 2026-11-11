import {
    boolean,
    doublePrecision,
    foreignKey,
    index,
    integer,
    primaryKey,
    text,
    timestamp,
} from "drizzle-orm/pg-core";
import createTable, { cascadeFk } from "./createTable";
import { user } from "./auth";
import { organization } from "./organization";

// Practice-test results copied from PrairieLearn (src/server/prairielearn/).
// A site admin turns the feature on for a school; then one of its teachers
// connects the school's course instance. IDs from PrairieLearn are kept as
// text, as its API returns them.

/**
 * A school that has the practice-test leaderboard (one row per school, made
 * when a site admin turns it on and deleted, with everything copied, when
 * they turn it off), and the PrairieLearn course instance its practice
 * tests are in, once a teacher connects one.
 */
export const prairielearnCourse = createTable(
    "prairielearn_course",
    {
        organizationId: text("organization_id").primaryKey(),
        /** When a site admin turned the feature on. */
        createdAt: timestamp("created_at").notNull().defaultNow(),

        // The connection; all null until a teacher connects a course.
        /** The PrairieLearn server, as an origin: https://us.prairielearn.com */
        serverUrl: text("server_url"),
        courseInstanceId: text("course_instance_id"),
        /**
         * The connecting teacher's PrairieLearn personal access token,
         * encrypted (src/server/prairielearn/token.ts). Never sent to
         * browsers.
         */
        encryptedToken: text("encrypted_token"),
        /** The course instance's name in PrairieLearn, for display. */
        name: text("name"),
        connectedBy: text("connected_by"),
        connectedAt: timestamp("connected_at"),

        /** When results were last copied successfully. */
        syncedAt: timestamp("synced_at"),
        /** Why the last copy failed; null once one succeeds. */
        syncError: text("sync_error"),
    },
    (t) => [
        cascadeFk(
            "prairielearn_course_organization_id_fk",
            t.organizationId,
            organization.id,
        ),
        // The connection outlives the teacher's account (their token still
        // works until revoked in PrairieLearn).
        foreignKey({
            name: "prairielearn_course_connected_by_fk",
            columns: [t.connectedBy],
            foreignColumns: [user.id],
        }).onDelete("set null"),
    ],
);

/** A practice test ("<Level> Practice Test") in a school's course. */
export const prairielearnAssessment = createTable(
    "prairielearn_assessment",
    {
        organizationId: text("organization_id").notNull(),
        assessmentId: text("assessment_id").notNull(),
        level: text("level").notNull(),
        /** PrairieLearn's order for the assessment, lowest first. */
        position: integer("position").notNull(),
    },
    (t) => [
        primaryKey({
            name: "prairielearn_assessment_pk",
            columns: [t.organizationId, t.assessmentId],
        }),
        cascadeFk(
            "prairielearn_assessment_organization_id_fk",
            t.organizationId,
            prairielearnCourse.organizationId,
        ),
    ],
);

/**
 * A student in a school's PrairieLearn course, and the site account their
 * results count for. A student who reaches PrairieLearn two ways (through
 * the LMS and with Google) is two PrairieLearn users, both linked to the
 * same account.
 */
export const prairielearnUser = createTable(
    "prairielearn_user",
    {
        organizationId: text("organization_id").notNull(),
        prairielearnUserId: text("prairielearn_user_id").notNull(),
        /** An email, or a pseudonymous ID for LMS (LTI) users. */
        uid: text("uid").notNull(),
        name: text("name"),
        userId: text("user_id"),
        /**
         * Set when a teacher links or unlinks this user, so later copies
         * don't link them by email again.
         */
        linkedByTeacher: boolean("linked_by_teacher").notNull().default(false),
    },
    (t) => [
        primaryKey({
            name: "prairielearn_user_pk",
            columns: [t.organizationId, t.prairielearnUserId],
        }),
        index("prairielearn_user_user_idx").on(t.userId),
        cascadeFk(
            "prairielearn_user_organization_id_fk",
            t.organizationId,
            prairielearnCourse.organizationId,
        ),
        // Deleting the account unlinks rather than forgets the user.
        foreignKey({
            name: "prairielearn_user_user_id_fk",
            columns: [t.userId],
            foreignColumns: [user.id],
        }).onDelete("set null"),
    ],
);

/** One attempt at a practice test. */
export const prairielearnAttempt = createTable(
    "prairielearn_attempt",
    {
        organizationId: text("organization_id").notNull(),
        assessmentInstanceId: text("assessment_instance_id").notNull(),
        assessmentId: text("assessment_id").notNull(),
        prairielearnUserId: text("prairielearn_user_id").notNull(),
        /**
         * PrairieLearn's points, only to notice a regraded attempt; the
         * leaderboard uses the UIL score from the counts below.
         */
        points: doublePrecision("points").notNull(),
        maxPoints: doublePrecision("max_points").notNull(),
        startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
        /** Whether the student is still taking it. */
        open: boolean("open").notNull(),
        // Questions answered right, answered wrong, and left blank, for UIL
        // scoring (src/lib/prairielearn/practice-tests.ts). Null until
        // fetched, which happens once the attempt is finished.
        correct: integer("correct"),
        wrong: integer("wrong"),
        skipped: integer("skipped"),
    },
    (t) => [
        primaryKey({
            name: "prairielearn_attempt_pk",
            columns: [t.organizationId, t.assessmentInstanceId],
        }),
        index("prairielearn_attempt_assessment_idx").on(
            t.organizationId,
            t.assessmentId,
        ),
        foreignKey({
            name: "prairielearn_attempt_assessment_fk",
            columns: [t.organizationId, t.assessmentId],
            foreignColumns: [
                prairielearnAssessment.organizationId,
                prairielearnAssessment.assessmentId,
            ],
        }).onDelete("cascade"),
        foreignKey({
            name: "prairielearn_attempt_user_fk",
            columns: [t.organizationId, t.prairielearnUserId],
            foreignColumns: [
                prairielearnUser.organizationId,
                prairielearnUser.prairielearnUserId,
            ],
        }).onDelete("cascade"),
    ],
);
