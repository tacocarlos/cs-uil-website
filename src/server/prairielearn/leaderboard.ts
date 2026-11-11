import { and, asc, desc, eq, isNotNull, isNull } from "drizzle-orm";
import {
    rankPracticeScores,
    type PracticeRanking,
} from "~/lib/prairielearn/practice-tests";
import { db } from "~/server/db";
import { user } from "~/server/db/schema/auth";
import { member } from "~/server/db/schema/organization";
import {
    prairielearnAssessment,
    prairielearnAttempt,
    prairielearnCourse,
    prairielearnUser,
} from "~/server/db/schema/prairielearn";
export type SchoolCourse = typeof prairielearnCourse.$inferSelect;

/** A school course with a course instance connected. */
export type ConnectedCourse = SchoolCourse & {
    courseInstanceId: string;
    name: string;
};

export function isConnected(
    course: SchoolCourse | null,
): course is ConnectedCourse {
    return course?.courseInstanceId != null && course.name !== null;
}

/**
 * A school's PrairieLearn settings, or null if a site admin hasn't turned
 * the practice-test leaderboard on for it. Includes the encrypted token:
 * never send the row to a browser as is.
 */
export async function schoolCourse(
    organizationId: string | null | undefined,
): Promise<SchoolCourse | null> {
    if (!organizationId) return null;
    const [course] = await db
        .select()
        .from(prairielearnCourse)
        .where(eq(prairielearnCourse.organizationId, organizationId));
    return course ?? null;
}

/**
 * Like schoolCourse, but only for a school the user currently belongs to:
 * null for former students (and anyone not in the school), who don't get
 * the practice-test leaderboard. Use this, not schoolCourse, to decide what
 * a viewer sees.
 */
export async function memberCourse(
    userId: string | null | undefined,
    organizationId: string | null | undefined,
): Promise<SchoolCourse | null> {
    if (!userId || !organizationId) return null;
    const [row] = await db
        .select({ course: prairielearnCourse })
        .from(prairielearnCourse)
        .innerJoin(
            member,
            and(
                eq(member.organizationId, prairielearnCourse.organizationId),
                eq(member.userId, userId),
                isNull(member.formerAt),
            ),
        )
        .where(eq(prairielearnCourse.organizationId, organizationId));
    return row?.course ?? null;
}

/** A school's practice tests in PrairieLearn's order. */
export function practiceTests(organizationId: string) {
    return db
        .select({
            assessmentId: prairielearnAssessment.assessmentId,
            level: prairielearnAssessment.level,
        })
        .from(prairielearnAssessment)
        .where(eq(prairielearnAssessment.organizationId, organizationId))
        .orderBy(
            asc(prairielearnAssessment.position),
            asc(prairielearnAssessment.level),
        );
}

/** The practice test most recently started by a linked student, if any. */
export async function latestPracticeTest(
    organizationId: string,
): Promise<string | null> {
    const [latest] = await db
        .select({ assessmentId: prairielearnAttempt.assessmentId })
        .from(prairielearnAttempt)
        .innerJoin(
            prairielearnUser,
            and(
                eq(
                    prairielearnUser.organizationId,
                    prairielearnAttempt.organizationId,
                ),
                eq(
                    prairielearnUser.prairielearnUserId,
                    prairielearnAttempt.prairielearnUserId,
                ),
            ),
        )
        .where(
            and(
                eq(prairielearnAttempt.organizationId, organizationId),
                isNotNull(prairielearnUser.userId),
            ),
        )
        .orderBy(desc(prairielearnAttempt.startedAt))
        .limit(1);
    return latest?.assessmentId ?? null;
}

export type PracticeLeaderboardRow = PracticeRanking & {
    /** The student hid their scores; only teachers see them. */
    hidden: boolean;
};

/**
 * The school's current members ranked by the UIL score (+6 right, −2
 * wrong, 0 blank) of their best finished attempt at a practice test,
 * counting every PrairieLearn user linked to each. Students who hid their
 * scores are left out unless `includeHidden` (for teachers).
 */
export async function practiceLeaderboard(
    organizationId: string,
    assessmentId: string,
    { includeHidden = false } = {},
): Promise<PracticeLeaderboardRow[]> {
    const rows = await db
        .select({
            userId: user.id,
            name: user.name,
            visible: user.showScoresInLeaderboard,
            correct: prairielearnAttempt.correct,
            wrong: prairielearnAttempt.wrong,
            skipped: prairielearnAttempt.skipped,
            startedAt: prairielearnAttempt.startedAt,
        })
        .from(prairielearnAttempt)
        .innerJoin(
            prairielearnUser,
            and(
                eq(
                    prairielearnUser.organizationId,
                    prairielearnAttempt.organizationId,
                ),
                eq(
                    prairielearnUser.prairielearnUserId,
                    prairielearnAttempt.prairielearnUserId,
                ),
            ),
        )
        .innerJoin(user, eq(user.id, prairielearnUser.userId))
        .innerJoin(
            member,
            and(
                eq(member.userId, user.id),
                eq(member.organizationId, organizationId),
                isNull(member.formerAt),
            ),
        )
        .where(
            and(
                eq(prairielearnAttempt.organizationId, organizationId),
                eq(prairielearnAttempt.assessmentId, assessmentId),
                eq(prairielearnAttempt.open, false),
                isNotNull(prairielearnAttempt.correct),
                includeHidden
                    ? undefined
                    : eq(user.showScoresInLeaderboard, true),
            ),
        );

    const hidden = new Set(rows.filter((r) => !r.visible).map((r) => r.userId));
    const tallied = rows.map((r) => ({
        ...r,
        correct: r.correct ?? 0,
        wrong: r.wrong ?? 0,
        skipped: r.skipped ?? 0,
    }));
    return rankPracticeScores(tallied).map((ranking) => ({
        ...ranking,
        hidden: hidden.has(ranking.userId),
    }));
}
