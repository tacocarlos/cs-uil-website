/**
 * Account bans (better-auth's admin plugin). Kept free of server imports
 * so client components can use it.
 */

/**
 * Whether a ban is in force. The plugin only clears an expired ban when
 * the user next signs in, so `banned` alone can be stale.
 */
export function isBanActive(
    user: { banned: boolean | null; banExpires: Date | null },
    now = new Date(),
): boolean {
    return !!user.banned && (!user.banExpires || user.banExpires > now);
}

const HOUR = 60 * 60;
const DAY = 24 * HOUR;

/** Ban lengths offered in the ban form, in seconds. */
export const BAN_DURATIONS = [
    { id: "1h", label: "1 hour", seconds: HOUR },
    { id: "1d", label: "1 day", seconds: DAY },
    { id: "3d", label: "3 days", seconds: 3 * DAY },
    { id: "1w", label: "1 week", seconds: 7 * DAY },
    { id: "2w", label: "2 weeks", seconds: 14 * DAY },
    { id: "30d", label: "30 days", seconds: 30 * DAY },
] as const;

/** Longest ban with an end date; anything longer should be permanent. */
export const MAX_BAN_SECONDS = 365 * DAY;
