import { TRPCError } from "@trpc/server";
import {
    and,
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
import {
    isSchoolTeacher,
    schoolsOf,
    type ActiveMembership,
} from "~/server/organizations";
import { withEffectiveStatus } from "~/lib/contest/status";
import { isSiteAdmin } from "~/lib/auth/roles";

// Two kinds of contest:
// - School contests (visibility "school" or "invite") are hosted by a
//   school. Its teachers manage them and may invite other schools, whose
//   teachers can decline.
// - Global contests ("open") have no host and are for everyone. Only site
//   admins create them.
// Site admins manage every contest.
//
// Who can see a contest: everyone if it's global; otherwise current members
// of the host school, plus (invite-only) current members of invited schools
// that haven't declined, plus anyone already enrolled (so former students,
// and students of schools that declined later, keep their results). Seeing
// a contest is what allows enrolling in it and viewing its leaderboard.
//
// Contests start and end on their own (src/lib/contest/status.ts), so the
// functions here return each contest with its status as of now.

/**
 * Who is managing contests: a site admin, and/or a teacher acting for
 * their active school (`organizationId`; null if not a teacher).
 */
export type ContestManager = {
    siteAdmin: boolean;
    organizationId: string | null;
};

export function contestManagerFor(
    user: { role?: string | null },
    membership: ActiveMembership | null,
): ContestManager {
    return {
        siteAdmin: isSiteAdmin(user.role),
        organizationId: isSchoolTeacher(membership)
            ? membership.organizationId
            : null,
    };
}

/** Site admins manage every contest; teachers, their school's contests. */
export function canManageContest(
    contestRow: { organizationId: string | null },
    manager: ContestManager | null,
): boolean {
    if (!manager) return false;
    return (
        manager.siteAdmin ||
        (contestRow.organizationId !== null &&
            contestRow.organizationId === manager.organizationId)
    );
}

/** The contest, or NOT_FOUND unless `manager` may manage it. */
export async function requireManagedContest(
    contestId: number,
    manager: ContestManager,
) {
    const [row] = await db
        .select()
        .from(contest)
        .where(eq(contest.id, contestId))
        .limit(1);
    if (!row || !canManageContest(row, manager)) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "No such contest that you manage",
        });
    }
    return withEffectiveStatus(row);
}

/** Statuses in which a contest's problems are shown to participants. */
const PROBLEMS_REVEALED = new Set<ContestStatus>(["active", "frozen", "ended"]);

/**
 * Whether the viewer may see which problems a contest has: once it has
 * started, or before that only as someone who manages it (and sets them
 * up).
 */
export function canSeeProblems(
    contestRow: { status: ContestStatus; organizationId: string | null },
    manager: ContestManager | null,
): boolean {
    return (
        PROBLEMS_REVEALED.has(contestRow.status) ||
        canManageContest(contestRow, manager)
    );
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
                            isNull(contestInvite.declinedAt),
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
    return row ? withEffectiveStatus(row) : null;
}

/**
 * The contest, if `userId` may see it or `manager` may manage it (site
 * admins open every contest, including school contests they aren't part
 * of).
 */
export async function findAccessibleContest(
    contestId: number,
    userId: string | null,
    manager: ContestManager | null,
) {
    const visible = await findVisibleContest(contestId, userId);
    if (visible || !manager) return visible;
    const [row] = await db
        .select()
        .from(contest)
        .where(eq(contest.id, contestId))
        .limit(1);
    return row && canManageContest(row, manager)
        ? withEffectiveStatus(row)
        : null;
}

/** Schools invited to the contest that haven't declined. */
export async function invitedSchoolIds(contestId: number) {
    const rows = await db
        .select({ id: contestInvite.organizationId })
        .from(contestInvite)
        .where(
            and(
                eq(contestInvite.contestId, contestId),
                isNull(contestInvite.declinedAt),
            ),
        );
    return rows.map((r) => r.id);
}

/**
 * Which school a student competes for: their active school if it may take
 * part, otherwise their earliest school that may. Global contests accept
 * any school, or none (null). Returns undefined if the student can't take
 * part at all.
 */
export function pickCompetingSchool(
    contestRow: {
        visibility: ContestVisibility;
        organizationId: string | null;
        /** Invited schools that haven't declined. */
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
    const rows = await schoolsOf(userId);
    return rows.map((r) => r.id);
}
