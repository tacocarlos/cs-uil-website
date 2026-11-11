/**
 * Site analytics (sign-ups, sign-ins, active users, retention), recorded in
 * our own database. Kept free of server imports so client components and
 * tests can use it; the recording and queries are in src/server/analytics.ts
 * and src/server/api/routers/analytics.ts.
 */

export const AUTH_EVENT_TYPES = ["sign-up", "sign-in", "sign-out"] as const;
export type AuthEventType = (typeof AUTH_EVENT_TYPES)[number];

/** Days and weeks are counted in UIL's time zone (Texas). */
export const ANALYTICS_TIME_ZONE = "America/Chicago";

/** How often, at most, one user's activity is written to the database. */
export const ACTIVITY_INTERVAL_MS = 5 * 60 * 1000;

/** Days shown in the daily charts. */
export const DAILY_CHART_DAYS = 30;

/** Sign-up weeks shown in the retention table (including this week). */
export const RETENTION_WEEKS = 8;

const dayFormat = new Intl.DateTimeFormat("en-CA", {
    timeZone: ANALYTICS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

/** The day (YYYY-MM-DD) `date` falls on in ANALYTICS_TIME_ZONE. */
export function dayInZone(date: Date): string {
    return dayFormat.format(date);
}

/** `day` (YYYY-MM-DD) moved by `days` calendar days. */
export function addDays(day: string, days: number): string {
    const date = new Date(`${day}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
}

/** The Monday starting `day`'s week, matching Postgres date_trunc('week'). */
export function weekStart(day: string): string {
    const weekday = new Date(`${day}T00:00:00Z`).getUTCDay(); // 0 = Sunday
    return addDays(day, -((weekday + 6) % 7));
}

/** The `count` days ending with `lastDay`, oldest first. */
export function daysEnding(lastDay: string, count: number): string[] {
    return Array.from({ length: count }, (_, i) =>
        addDays(lastDay, i - count + 1),
    );
}

/** Per-day counts for `days`, with 0 for days missing from `rows`. */
export function fillDays(
    days: string[],
    rows: { day: string; count: number }[],
): number[] {
    const byDay = new Map(rows.map((row) => [row.day, row.count]));
    return days.map((day) => byDay.get(day) ?? 0);
}

export type RetentionRow = {
    /** Monday of the week these users signed up. */
    week: string;
    signUps: number;
    /**
     * Share (0 to 1) of them active in the sign-up week (index 0), the week
     * after (1), and so on; null for weeks that haven't happened yet.
     */
    rates: (number | null)[];
};

/**
 * Weekly retention: for each sign-up week (oldest first, the last being
 * `thisWeek`), the share of its users active each week since.
 */
export function buildRetention(
    thisWeek: string,
    weeks: number,
    cohorts: { week: string; size: number }[],
    activity: { week: string; offset: number; count: number }[],
): RetentionRow[] {
    const sizes = new Map(cohorts.map((c) => [c.week, c.size]));
    const active = new Map(
        activity.map((a) => [`${a.week}/${a.offset}`, a.count]),
    );
    return Array.from({ length: weeks }, (_, i) => {
        const week = addDays(thisWeek, (i - weeks + 1) * 7);
        const signUps = sizes.get(week) ?? 0;
        const elapsed = weeks - 1 - i; // full weeks since this one
        const rates = Array.from({ length: weeks }, (_, offset) => {
            if (offset > elapsed) return null;
            if (signUps === 0) return 0;
            return (active.get(`${week}/${offset}`) ?? 0) / signUps;
        });
        return { week, signUps, rates };
    });
}

/**
 * How a sign-in happened, from the auth endpoint that created the session:
 * the provider for OAuth callbacks ("google"), else the sign-in route
 * ("email"). Null when it isn't a recognized sign-in route.
 */
export function signInMethod(
    context: { path?: string; params?: unknown } | null | undefined,
): string | null {
    const path = context?.path;
    if (!path) return null;
    if (path.startsWith("/callback/") || path.startsWith("/oauth2/callback")) {
        const params = context.params as { id?: unknown } | undefined;
        if (typeof params?.id === "string") return params.id;
        const provider = path.split("/")[2];
        return provider && !provider.startsWith(":") ? provider : null;
    }
    if (path.startsWith("/sign-in/")) {
        return path.slice("/sign-in/".length) || null;
    }
    // Only server code reaches /sign-up/email, to create username accounts
    // (see src/lib/auth/usernames.ts).
    if (path === "/sign-up/email") return "username";
    if (path.startsWith("/sign-up/")) {
        return path.slice("/sign-up/".length) || null;
    }
    return null;
}

export type LatestAction = { label: string; at: Date };

const METHOD_LABELS: Record<string, string> = {
    google: "Google",
    github: "GitHub",
    microsoft: "Microsoft",
    username: "username",
    email: "email and password",
};

/** "Signed in with Google", "Signed out", etc. */
export function describeAuthEvent(event: {
    type: AuthEventType;
    method: string | null;
}): string {
    const verb = {
        "sign-up": "Signed up",
        "sign-in": "Signed in",
        "sign-out": "Signed out",
    }[event.type];
    if (!event.method || event.type === "sign-out") return verb;
    return `${verb} with ${METHOD_LABELS[event.method] ?? event.method}`;
}

/**
 * The user's most recent action: their latest sign-up/in/out, or using the
 * site, whichever was later. Null if neither has been recorded.
 *
 * lastActiveAt is only updated every few minutes, so activity within that
 * window of an auth event is treated as part of it (signing in is followed
 * by loading a page; that shouldn't hide the sign-in).
 */
export function latestAction(
    lastActiveAt: Date | null,
    lastEvent: { type: AuthEventType; method: string | null; at: Date } | null,
): LatestAction | null {
    const event = lastEvent && {
        label: describeAuthEvent(lastEvent),
        at: lastEvent.at,
    };
    const active = lastActiveAt && { label: "Used the site", at: lastActiveAt };
    if (!event || !active) return event ?? active;
    return active.at.getTime() - event.at.getTime() > ACTIVITY_INTERVAL_MS
        ? active
        : event;
}

/**
 * Remembers when each user's activity was last recorded, so a busy user
 * costs at most one write per ACTIVITY_INTERVAL_MS per server instance.
 */
export class ActivityThrottle {
    private readonly last = new Map<string, { at: number; day: string }>();

    constructor(
        private readonly intervalMs = ACTIVITY_INTERVAL_MS,
        private readonly maxEntries = 10_000,
    ) {}

    /**
     * Whether to record activity for `userId` at `now` (and note that we
     * did). Always true on a new day, so every active day gets its row.
     */
    shouldRecord(userId: string, now = new Date()): boolean {
        const at = now.getTime();
        const day = dayInZone(now);
        const last = this.last.get(userId);
        if (last?.day === day && at - last.at < this.intervalMs) {
            return false;
        }
        if (this.last.size >= this.maxEntries) this.last.clear();
        this.last.set(userId, { at, day });
        return true;
    }
}
