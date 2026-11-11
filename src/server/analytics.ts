import { and, eq, isNull, lt, or } from "drizzle-orm";
import {
    ACTIVITY_INTERVAL_MS,
    ActivityThrottle,
    dayInZone,
    type AuthEventType,
} from "~/lib/analytics";
import { db } from "~/server/db";
import { authEvent, userActivity } from "~/server/db/schema/analytics";
import { user } from "~/server/db/schema/auth";

/**
 * Recording for the site admin analytics page; called from auth.ts. Failures
 * are logged, never thrown: analytics must not break signing in.
 */

async function safely(what: string, task: () => Promise<unknown>) {
    try {
        await task();
    } catch (err) {
        console.error(`[analytics] Failed to record ${what}:`, err);
    }
}

export function recordAuthEvent(
    userId: string,
    type: AuthEventType,
    method: string | null = null,
) {
    return safely(type, () =>
        db.insert(authEvent).values({ userId, type, method }),
    );
}

const throttle = new ActivityThrottle();

/**
 * Notes that the user is using the site: marks today as an active day and
 * updates lastActiveAt. Cheap to call on every request; it writes at most
 * once per ACTIVITY_INTERVAL_MS per user (per server instance, and the
 * lastActiveAt update is also skipped in the database if another instance
 * just did it).
 */
export function recordActivity(userId: string, now = new Date()) {
    if (!throttle.shouldRecord(userId, now)) return Promise.resolve();
    const staleBefore = new Date(now.getTime() - ACTIVITY_INTERVAL_MS);
    return safely("activity", () =>
        Promise.all([
            db
                .insert(userActivity)
                .values({ userId, day: dayInZone(now) })
                .onConflictDoNothing(),
            db
                .update(user)
                .set({ lastActiveAt: now })
                .where(
                    and(
                        eq(user.id, userId),
                        or(
                            isNull(user.lastActiveAt),
                            lt(user.lastActiveAt, staleBefore),
                        ),
                    ),
                ),
        ]),
    );
}
