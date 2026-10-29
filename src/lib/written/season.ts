/**
 * A UIL season runs August 1 through July 31: the virtual challenge meets
 * are in the fall and the main contests in the spring. Seasons are named by
 * the year they end in, so October 2026 and March 2027 are both in the 2027
 * season.
 */
const FIRST_MONTH = 8; // August

/**
 * The season a date falls in. Takes a Date (by its local date) or an ISO
 * date string like "2026-10-17", read as written so time zones can't move
 * it to a different day.
 */
export function seasonYearOf(date: Date | string): number {
    const [year, month] =
        typeof date === "string"
            ? date.split("-").map(Number)
            : [date.getFullYear(), date.getMonth() + 1];
    return month! >= FIRST_MONTH ? year! + 1 : year!;
}

/** The season happening now. */
export function currentSeasonYear(): number {
    return seasonYearOf(new Date());
}

/**
 * A season picked by name, as in ?year=: "all" for every season
 * (undefined), a year like "2027", or anything else ("current", nothing)
 * for the current one.
 */
export function parseSeasonYear(value: string | undefined): number | undefined {
    if (value === "all") return undefined;
    return value !== undefined && /^\d+$/.test(value)
        ? Number(value)
        : currentSeasonYear();
}
