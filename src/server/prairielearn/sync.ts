import { and, eq, isNull, notInArray, sql } from "drizzle-orm";
import {
    practiceTestLevel,
    questionOutcome,
    tallyOutcomes,
    type UilTally,
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
import {
    listAssessmentInstances,
    listAssessments,
    listInstanceQuestions,
    PrairieLearnError,
    type Connection,
    type PrairieLearnAssessmentInstance,
} from "./api";
import { connectionOf } from "./connection";

/** How old copied results may get before a page view refreshes them. */
export const STALE_AFTER_MS = 10 * 60 * 1000;

/** Rows per INSERT, well under Postgres's parameter limit. */
const CHUNK = 500;

function chunks<T>(rows: T[]): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < rows.length; i += CHUNK) {
        out.push(rows.slice(i, i + CHUNK));
    }
    return out;
}

/** Per-question requests in flight at once, to go easy on PrairieLearn. */
const CONCURRENCY = 4;

/** A student attempt with everything the leaderboard needs. */
type CompleteInstance = PrairieLearnAssessmentInstance & {
    points: number;
    max_points: number;
    start_date: string;
};

function isStudentAttempt(
    instance: PrairieLearnAssessmentInstance,
): instance is CompleteInstance {
    return (
        instance.user_role?.toLowerCase() === "student" &&
        instance.points !== null &&
        instance.max_points !== null &&
        instance.start_date !== null
    );
}

/**
 * Copies a school's practice-test results from PrairieLearn, replacing what
 * was copied before, then links new PrairieLearn users to school members
 * with the same email (unless a teacher has set their link). Records the
 * outcome on the school's course row; throws PrairieLearnError on failure.
 * Does nothing for a school without a connected course, or with a made-up
 * one (see connectionOf).
 */
export async function syncSchool(organizationId: string): Promise<void> {
    const [course] = await db
        .select({
            serverUrl: prairielearnCourse.serverUrl,
            courseInstanceId: prairielearnCourse.courseInstanceId,
            encryptedToken: prairielearnCourse.encryptedToken,
        })
        .from(prairielearnCourse)
        .where(eq(prairielearnCourse.organizationId, organizationId));
    if (!course) return;

    try {
        const connection = connectionOf(course);
        if (!connection) return;
        await copyResults(organizationId, connection);
    } catch (error) {
        const message =
            error instanceof PrairieLearnError
                ? error.message
                : "Something went wrong copying results from PrairieLearn.";
        if (!(error instanceof PrairieLearnError)) {
            console.error("[prairielearn] sync failed", error);
        }
        await db
            .update(prairielearnCourse)
            .set({ syncError: message })
            .where(eq(prairielearnCourse.organizationId, organizationId));
        throw new PrairieLearnError(message);
    }
}

async function copyResults(organizationId: string, connection: Connection) {
    const practiceTests = (await listAssessments(connection)).flatMap((a) => {
        const level = a.title ? practiceTestLevel(a.title) : null;
        return level
            ? [
                  {
                      organizationId,
                      assessmentId: a.assessment_id,
                      level,
                      position: a.assessment_order_by ?? 0,
                  },
              ]
            : [];
    });
    const instances = (
        await Promise.all(
            practiceTests.map((t) =>
                listAssessmentInstances(connection, t.assessmentId),
            ),
        )
    )
        .flat()
        .filter(isStudentAttempt);

    const users = new Map<string, typeof prairielearnUser.$inferInsert>();
    for (const i of instances) {
        users.set(i.user_id, {
            organizationId,
            prairielearnUserId: i.user_id,
            uid: i.user_uid,
            name: i.user_name,
        });
    }
    const tallies = await uilTallies(organizationId, connection, instances);
    const attempts = instances.map((i) => ({
        organizationId,
        assessmentInstanceId: i.assessment_instance_id,
        assessmentId: i.assessment_id,
        prairielearnUserId: i.user_id,
        points: i.points,
        maxPoints: i.max_points,
        startedAt: new Date(i.start_date),
        open: i.open ?? false,
        correct: null,
        wrong: null,
        skipped: null,
        ...tallies.get(i.assessment_instance_id),
    }));

    await db.transaction(async (tx) => {
        // Practice tests no longer in the course go, with their attempts.
        await tx.delete(prairielearnAssessment).where(
            and(
                eq(prairielearnAssessment.organizationId, organizationId),
                practiceTests.length
                    ? notInArray(
                          prairielearnAssessment.assessmentId,
                          practiceTests.map((t) => t.assessmentId),
                      )
                    : undefined,
            ),
        );
        if (practiceTests.length) {
            await tx
                .insert(prairielearnAssessment)
                .values(practiceTests)
                .onConflictDoUpdate({
                    target: [
                        prairielearnAssessment.organizationId,
                        prairielearnAssessment.assessmentId,
                    ],
                    set: {
                        level: sql`excluded.level`,
                        position: sql`excluded.position`,
                    },
                });
        }

        // Users are kept (with their links) even once they have no
        // attempts, so a teacher's link survives a deleted attempt.
        for (const rows of chunks([...users.values()])) {
            await tx
                .insert(prairielearnUser)
                .values(rows)
                .onConflictDoUpdate({
                    target: [
                        prairielearnUser.organizationId,
                        prairielearnUser.prairielearnUserId,
                    ],
                    set: { uid: sql`excluded.uid`, name: sql`excluded.name` },
                });
        }

        // Attempts deleted in PrairieLearn go here too.
        await tx.delete(prairielearnAttempt).where(
            and(
                eq(prairielearnAttempt.organizationId, organizationId),
                attempts.length
                    ? notInArray(
                          prairielearnAttempt.assessmentInstanceId,
                          attempts.map((a) => a.assessmentInstanceId),
                      )
                    : undefined,
            ),
        );
        for (const rows of chunks(attempts)) {
            await tx
                .insert(prairielearnAttempt)
                .values(rows)
                .onConflictDoUpdate({
                    target: [
                        prairielearnAttempt.organizationId,
                        prairielearnAttempt.assessmentInstanceId,
                    ],
                    set: {
                        assessmentId: sql`excluded.assessment_id`,
                        prairielearnUserId: sql`excluded.prairielearn_user_id`,
                        points: sql`excluded.points`,
                        maxPoints: sql`excluded.max_points`,
                        startedAt: sql`excluded.started_at`,
                        open: sql`excluded.open`,
                        correct: sql`excluded.correct`,
                        wrong: sql`excluded.wrong`,
                        skipped: sql`excluded.skipped`,
                    },
                });
        }

        // Link users whose PrairieLearn UID is a school member's email.
        await tx
            .update(prairielearnUser)
            .set({
                userId: sql`(
                    SELECT ${user.id} FROM ${user}
                    INNER JOIN ${member} ON ${member.userId} = ${user.id}
                    WHERE ${member.organizationId} = ${organizationId}
                      AND lower(${user.email}) = lower(${prairielearnUser.uid})
                    LIMIT 1
                )`,
            })
            .where(
                and(
                    eq(prairielearnUser.organizationId, organizationId),
                    isNull(prairielearnUser.userId),
                    eq(prairielearnUser.linkedByTeacher, false),
                ),
            );

        await tx
            .update(prairielearnCourse)
            .set({ syncedAt: new Date(), syncError: null })
            .where(eq(prairielearnCourse.organizationId, organizationId));
    });
}

/**
 * How many questions each finished attempt got right, wrong, and left
 * blank, by assessment instance ID. Finished attempts don't change unless
 * regraded, so their questions are only fetched when an attempt is new,
 * just finished, or its points changed; otherwise the copied counts are
 * kept. Attempts still open are left out.
 */
async function uilTallies(
    organizationId: string,
    connection: Connection,
    instances: CompleteInstance[],
): Promise<Map<string, UilTally>> {
    const copied = new Map(
        (
            await db
                .select({
                    id: prairielearnAttempt.assessmentInstanceId,
                    points: prairielearnAttempt.points,
                    maxPoints: prairielearnAttempt.maxPoints,
                    open: prairielearnAttempt.open,
                    correct: prairielearnAttempt.correct,
                    wrong: prairielearnAttempt.wrong,
                    skipped: prairielearnAttempt.skipped,
                })
                .from(prairielearnAttempt)
                .where(eq(prairielearnAttempt.organizationId, organizationId))
        ).map((row) => [row.id, row]),
    );

    const tallies = new Map<string, UilTally>();
    const toFetch: string[] = [];
    for (const i of instances) {
        if (i.open) continue;
        const old = copied.get(i.assessment_instance_id);
        if (
            old &&
            !old.open &&
            old.points === i.points &&
            old.maxPoints === i.max_points &&
            old.correct !== null &&
            old.wrong !== null &&
            old.skipped !== null
        ) {
            const { correct, wrong, skipped } = old;
            tallies.set(i.assessment_instance_id, { correct, wrong, skipped });
        } else {
            toFetch.push(i.assessment_instance_id);
        }
    }

    // A few at a time, each worker taking the next ID.
    let next = 0;
    async function worker() {
        while (next < toFetch.length) {
            const id = toFetch[next++]!;
            const questions = await listInstanceQuestions(connection, id);
            tallies.set(
                id,
                tallyOutcomes(
                    questions.map((q) =>
                        questionOutcome({
                            numberAttempts: q.number_attempts,
                            lastSubmissionScore: q.last_submission_score,
                        }),
                    ),
                ),
            );
        }
    }
    await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, toFetch.length) }, worker),
    );
    return tallies;
}

/** Syncs in progress in this server process, so page views share one. */
const inFlight = new Map<string, Promise<void>>();

/**
 * Syncs a school (see syncSchool), or joins the sync already running for
 * it in this process.
 */
export function syncSchoolOnce(organizationId: string): Promise<void> {
    let running = inFlight.get(organizationId);
    if (!running) {
        running = syncSchool(organizationId).finally(() =>
            inFlight.delete(organizationId),
        );
        inFlight.set(organizationId, running);
    }
    return running;
}

/** Whether results copied at `syncedAt` are due for a refresh. */
export function isStale(syncedAt: Date | null, now = Date.now()): boolean {
    return syncedAt === null || now - syncedAt.getTime() > STALE_AFTER_MS;
}
