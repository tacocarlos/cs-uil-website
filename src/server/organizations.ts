import { and, eq, inArray, sql, type SQL } from "drizzle-orm";
import { type AnyPgColumn } from "drizzle-orm/pg-core";
import { isTeacherRole, type MemberRole } from "~/lib/auth/organizations";
import { type SchoolFilter } from "~/lib/schools";
import { db } from "~/server/db";
import { user } from "~/server/db/schema/auth";
import { member, organization } from "~/server/db/schema/organization";

/** The signed-in user's membership in the school they're acting in. */
export type ActiveMembership = {
    organizationId: string;
    role: MemberRole;
};

/**
 * Looks up the session's active school and the user's role in it. Returns
 * null when there's no active school or the user is no longer a member.
 */
export async function getActiveMembership(session: {
    user: { id: string };
    session: { activeOrganizationId?: string | null };
}): Promise<ActiveMembership | null> {
    const organizationId = session.session.activeOrganizationId;
    if (!organizationId) return null;

    const [row] = await db
        .select({ role: member.role })
        .from(member)
        .where(
            and(
                eq(member.organizationId, organizationId),
                eq(member.userId, session.user.id),
            ),
        )
        .limit(1);
    return row ? { organizationId, role: row.role as MemberRole } : null;
}

/** Whether the user teaches (owns or administers) their active school. */
export function isSchoolTeacher(membership: ActiveMembership | null): boolean {
    return isTeacherRole(membership?.role);
}

/**
 * Condition limiting a user ID column to members of a school, e.g.
 * `.where(inSchool(submission.userId, organizationId))`.
 */
export function inSchool(userId: AnyPgColumn, organizationId: string): SQL {
    return inArray(
        userId,
        db
            .select({ id: member.userId })
            .from(member)
            .where(eq(member.organizationId, organizationId)),
    );
}

export type LeaderboardScope = "school" | "global";

/**
 * Which users a leaderboard may show. School leaderboards show the school's
 * members; the global one shows only users who opted in, optionally only
 * from schools matching `filter`. Either way, users who hid their scores
 * never appear. A school leaderboard without a school shows no one.
 */
export function leaderboardVisibility(
    scope: LeaderboardScope,
    organizationId: string | null,
    filter: SchoolFilter = {},
): SQL {
    const visible = eq(user.showScoresInLeaderboard, true);
    if (scope === "global") {
        return and(
            visible,
            eq(user.showInGlobalLeaderboard, true),
            inMatchingSchool(user.id, filter),
        )!;
    }
    if (!organizationId) return sql`false`;
    return and(visible, inSchool(user.id, organizationId))!;
}

/**
 * Condition limiting a user ID column to members of schools matching the
 * filter; undefined (no condition) when the filter is empty.
 */
function inMatchingSchool(
    userId: AnyPgColumn,
    { conference, region, district }: SchoolFilter,
): SQL | undefined {
    if (!conference) return undefined;
    return inArray(
        userId,
        db
            .select({ id: member.userId })
            .from(member)
            .innerJoin(organization, eq(member.organizationId, organization.id))
            .where(
                and(
                    eq(organization.conference, conference),
                    region === undefined
                        ? undefined
                        : eq(organization.region, region),
                    district === undefined
                        ? undefined
                        : eq(organization.district, district),
                ),
            ),
    );
}
