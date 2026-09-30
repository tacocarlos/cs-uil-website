import {
    and,
    asc,
    eq,
    inArray,
    isNull,
    notInArray,
    sql,
    type SQL,
} from "drizzle-orm";
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

/**
 * Names of each user's current schools (not ones they're a former student
 * of), alphabetical, for showing next to them on leaderboards shared by all
 * schools. Users without a current school are omitted.
 */
export async function schoolNamesByUser(
    userIds: string[],
): Promise<Map<string, string[]>> {
    const names = new Map<string, string[]>();
    if (userIds.length === 0) return names;

    const rows = await db
        .select({ userId: member.userId, name: organization.name })
        .from(member)
        .innerJoin(organization, eq(member.organizationId, organization.id))
        .where(and(inArray(member.userId, userIds), isNull(member.formerAt)))
        .orderBy(asc(organization.name));
    for (const { userId, name } of rows) {
        names.set(userId, [...(names.get(userId) ?? []), name]);
    }
    return names;
}

/** Whether the user teaches (owns or administers) their active school. */
export function isSchoolTeacher(membership: ActiveMembership | null): boolean {
    return isTeacherRole(membership?.role);
}

/**
 * Condition limiting a user ID column to members of a school, e.g.
 * `.where(inSchool(submission.userId, organizationId))`. Includes former
 * students unless `currentOnly` is set.
 */
export function inSchool(
    userId: AnyPgColumn,
    organizationId: string,
    { currentOnly = false } = {},
): SQL {
    return inArray(
        userId,
        db
            .select({ id: member.userId })
            .from(member)
            .where(
                and(
                    eq(member.organizationId, organizationId),
                    currentOnly ? isNull(member.formerAt) : undefined,
                ),
            ),
    );
}

/**
 * Condition excluding users who are former students at every school they
 * belong to (users in no school at all still pass).
 */
function notFormerEverywhere(userId: AnyPgColumn): SQL {
    return notInArray(
        userId,
        db
            .select({ id: member.userId })
            .from(member)
            .groupBy(member.userId)
            .having(sql`bool_and(${member.formerAt} IS NOT NULL)`),
    );
}

export type LeaderboardScope = "school" | "global";

/**
 * Which users a leaderboard may show. School leaderboards show the school's
 * current members; the global one shows only users who opted in, optionally
 * only from schools matching `filter`, and not those who are former
 * students everywhere. Either way, users who hid their scores never appear.
 * A school leaderboard without a school shows no one.
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
            notFormerEverywhere(user.id),
            inMatchingSchool(user.id, filter),
        )!;
    }
    if (!organizationId) return sql`false`;
    return and(
        visible,
        inSchool(user.id, organizationId, { currentOnly: true }),
    )!;
}

/**
 * Condition limiting a user ID column to current members of schools
 * matching the filter; undefined (no condition) when the filter is empty.
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
                    isNull(member.formerAt),
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
