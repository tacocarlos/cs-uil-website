import { and, count, countDistinct, eq, gte, min, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import {
    ANALYTICS_TIME_ZONE,
    DAILY_CHART_DAYS,
    RETENTION_WEEKS,
    addDays,
    buildRetention,
    dayInZone,
    daysEnding,
    fillDays,
    weekStart,
} from "~/lib/analytics";
import { createTRPCRouter, siteAdminProcedure } from "../trpc";
import { db } from "~/server/db";
import { authEvent, userActivity } from "~/server/db/schema/analytics";
import { user } from "~/server/db/schema/auth";

// The zone is a constant, inlined (not a bound parameter) so the same
// expression can appear in SELECT and GROUP BY.
const ZONE = sql.raw(`'${ANALYTICS_TIME_ZONE}'`);

/**
 * The analytics day (YYYY-MM-DD) of a `timestamp` column. Timestamps are
 * stored without a zone, in UTC (the server's zone).
 */
function localDay(column: PgColumn) {
    return sql<string>`to_char((${column} at time zone 'UTC') at time zone ${ZONE}, 'YYYY-MM-DD')`;
}

/** Monday (YYYY-MM-DD) of the week of a `timestamp` column. */
function localWeek(column: PgColumn) {
    return sql<string>`to_char(date_trunc('week', (${column} at time zone 'UTC') at time zone ${ZONE}), 'YYYY-MM-DD')`;
}

/** Monday (YYYY-MM-DD) of the week of a `date` column. */
function dateWeek(column: PgColumn) {
    return sql<string>`to_char(date_trunc('week', ${column}), 'YYYY-MM-DD')`;
}

/** Distinct users active from `firstDay` through today. */
async function activeSince(firstDay: string) {
    const [row] = await db
        .select({ count: countDistinct(userActivity.userId) })
        .from(userActivity)
        .where(gte(userActivity.day, firstDay));
    return row?.count ?? 0;
}

// Site usage, from our own tables (see src/lib/analytics.ts).
export const analyticsRouter = createTRPCRouter({
    /** Headline numbers. */
    summary: siteAdminProcedure.query(async () => {
        const today = dayInZone(new Date());
        const [[users], [newUsers], [tracking], daily, weekly, monthly] =
            await Promise.all([
                db.select({ count: count() }).from(user),
                db
                    .select({ count: count() })
                    .from(user)
                    .where(
                        gte(
                            localDay(user.createdAt),
                            addDays(today, -(DAILY_CHART_DAYS - 1)),
                        ),
                    ),
                db.select({ since: min(userActivity.day) }).from(userActivity),
                activeSince(today),
                activeSince(addDays(today, -6)),
                activeSince(addDays(today, -29)),
            ]);
        return {
            totalUsers: users?.count ?? 0,
            newUsers: newUsers?.count ?? 0,
            activeToday: daily,
            activeThisWeek: weekly,
            activeThisMonth: monthly,
            /** First day activity was recorded; null if none yet. */
            trackingSince: tracking?.since ?? null,
        };
    }),

    /** Sign-ups, sign-ins, and active users per day, oldest first. */
    daily: siteAdminProcedure.query(async () => {
        const days = daysEnding(dayInZone(new Date()), DAILY_CHART_DAYS);
        const first = days[0]!;
        const signUpDay = localDay(user.createdAt);
        const signInDay = localDay(authEvent.createdAt);

        const [signUps, signIns, active] = await Promise.all([
            db
                .select({ day: signUpDay, count: count() })
                .from(user)
                .where(gte(signUpDay, first))
                .groupBy(signUpDay),
            db
                .select({ day: signInDay, count: count() })
                .from(authEvent)
                .where(
                    and(eq(authEvent.type, "sign-in"), gte(signInDay, first)),
                )
                .groupBy(signInDay),
            db
                .select({ day: userActivity.day, count: count() })
                .from(userActivity)
                .where(gte(userActivity.day, first))
                .groupBy(userActivity.day),
        ]);

        const signUpCounts = fillDays(days, signUps);
        const signInCounts = fillDays(days, signIns);
        const activeCounts = fillDays(days, active);
        return days.map((day, i) => ({
            day,
            signUps: signUpCounts[i]!,
            signIns: signInCounts[i]!,
            activeUsers: activeCounts[i]!,
        }));
    }),

    /** Weekly retention by sign-up week (see buildRetention). */
    retention: siteAdminProcedure.query(async () => {
        const thisWeek = weekStart(dayInZone(new Date()));
        const firstWeek = addDays(thisWeek, -(RETENTION_WEEKS - 1) * 7);
        const cohortWeek = localWeek(user.createdAt);
        const activeWeek = dateWeek(userActivity.day);
        const offset = sql<number>`((date_trunc('week', ${userActivity.day})::date - ${cohortWeek}::date) / 7)::int`;

        const [cohorts, activity] = await Promise.all([
            db
                .select({ week: cohortWeek, size: count() })
                .from(user)
                .where(gte(cohortWeek, firstWeek))
                .groupBy(cohortWeek),
            db
                .select({
                    week: cohortWeek,
                    offset,
                    count: countDistinct(userActivity.userId),
                })
                .from(userActivity)
                .innerJoin(user, eq(user.id, userActivity.userId))
                .where(
                    and(
                        gte(cohortWeek, firstWeek),
                        gte(activeWeek, cohortWeek),
                    ),
                )
                .groupBy(cohortWeek, offset),
        ]);

        return buildRetention(thisWeek, RETENTION_WEEKS, cohorts, activity);
    }),
});
