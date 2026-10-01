import { TRPCError } from "@trpc/server";
import {
    and,
    asc,
    eq,
    exists,
    inArray,
    isNull,
    or,
    sql,
    type SQL,
} from "drizzle-orm";
import { db } from "~/server/db";
import {
    contest,
    contestEnrollment,
    contestInvite,
    type ContestStatus,
    type ContestVisibility,
} from "~/server/db/schema/contest";
import { member } from "~/server/db/schema/organization";
import { isSchoolTeacher, type ActiveMembership } from "~/server/organizations";

// Who can see a contest: everyone if it's open; otherwise current members of
// the host school, plus (invite-only) current members of invited schools,
// plus anyone already enrolled (so former students keep their results).
// Seeing a contest is what allows enrolling in it and viewing its
// leaderboard.

/** Statuses in which a contest's problems are shown to participants. */
const PROBLEMS_REVEALED = new Set<ContestStatus>(["active", "frozen", "ended"]);

/**
 * Whether the viewer may see which problems a contest has: once it has
 * started, or before that only as a teacher of the host school (who sets
 * them up).
 */
export function canSeeProblems(
    contestRow: { status: ContestStatus; organizationId: string },
    membership: ActiveMembership | null,
): boolean {
    return (
        PROBLEMS_REVEALED.has(contestRow.status) ||
        (isSchoolTeacher(membership) &&
            membership?.organizationId === contestRow.organizationId)
    );
}

/** The user's current (not former) schools. */
function schoolsOf(userId: string) {
    return db
        .select({ id: member.organizationId })
        .from(member)
        .where(and(eq(member.userId, userId), isNull(member.formerAt)));
}

/** Condition selecting the contests `userId` (null: signed out) may see. */
export function visibleContests(userId: string | null): SQL {
    const open = eq(contest.visibility, "open");
    if (!userId) return open;
    return or(
        open,
        exists(
            db
                .select({ one: sql`1` })
                .from(contestEnrollment)
                .where(
                    and(
                        eq(contestEnrollment.contestId, contest.id),
                        eq(contestEnrollment.userId, userId),
                    ),
                ),
        ),
        inArray(contest.organizationId, schoolsOf(userId)),
        and(
            eq(contest.visibility, "invite"),
            exists(
                db
                    .select({ one: sql`1` })
                    .from(contestInvite)
                    .where(
                        and(
                            eq(contestInvite.contestId, contest.id),
                            inArray(
                                contestInvite.organizationId,
                                schoolsOf(userId),
                            ),
                        ),
                    ),
            ),
        ),
    )!;
}

/** The contest, if `userId` may see it. */
export async function findVisibleContest(
    contestId: number,
    userId: string | null,
) {
    const [row] = await db
        .select()
        .from(contest)
        .where(and(eq(contest.id, contestId), visibleContests(userId)))
        .limit(1);
    return row ?? null;
}

/** Throws NOT_FOUND unless the contest is hosted by this school. */
export async function requireHostedContest(
    contestId: number,
    organizationId: string,
) {
    const [row] = await db
        .select({ id: contest.id })
        .from(contest)
        .where(
            and(
                eq(contest.id, contestId),
                eq(contest.organizationId, organizationId),
            ),
        )
        .limit(1);
    if (!row) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "No such contest at your school",
        });
    }
}

export async function invitedSchoolIds(contestId: number) {
    const rows = await db
        .select({ id: contestInvite.organizationId })
        .from(contestInvite)
        .where(eq(contestInvite.contestId, contestId));
    return rows.map((r) => r.id);
}

/**
 * Which school a student competes for: their active school if it may take
 * part, otherwise their earliest school that may. Open contests accept
 * any school, or none (null). Returns undefined if the student can't take
 * part at all.
 */
export function pickCompetingSchool(
    contestRow: {
        visibility: ContestVisibility;
        organizationId: string;
        invited: string[];
    },
    /** The student's schools, earliest joined first. */
    schools: string[],
    activeSchool: string | null,
): string | null | undefined {
    const eligible =
        contestRow.visibility === "open"
            ? schools
            : schools.filter(
                  (s) =>
                      s === contestRow.organizationId ||
                      (contestRow.visibility === "invite" &&
                          contestRow.invited.includes(s)),
              );
    if (activeSchool && eligible.includes(activeSchool)) return activeSchool;
    if (eligible[0]) return eligible[0];
    return contestRow.visibility === "open" ? null : undefined;
}

/**
 * The student's current schools (not ones they're a former student of),
 * earliest joined first: the schools they can compete for.
 */
export async function schoolIdsOf(userId: string) {
    const rows = await db
        .select({ id: member.organizationId })
        .from(member)
        .where(and(eq(member.userId, userId), isNull(member.formerAt)))
        .orderBy(asc(member.createdAt));
    return rows.map((r) => r.id);
}
