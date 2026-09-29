/**
 * UIL classification of schools, used to compare students against similar
 * schools. Districts and regions are numbered within each conference:
 * District 23-2A and District 23-3A are unrelated. Values follow UIL's
 * academic alignment, which changes every two years.
 */

export const CONFERENCES = ["1A", "2A", "3A", "4A", "5A", "6A"] as const;
export type Conference = (typeof CONFERENCES)[number];

export const REGIONS = [1, 2, 3, 4] as const;

/** Highest district number in any conference (6A has 32). */
export const MAX_DISTRICT = 32;

export function isConference(value: unknown): value is Conference {
    return CONFERENCES.includes(value as Conference);
}

/** UIL's names, e.g. "District 23-2A" and "Region II-2A". */
export function districtLabel(district: number, conference: Conference) {
    return `District ${district}-${conference}`;
}

const ROMAN = ["I", "II", "III", "IV"];

export function regionLabel(region: number, conference: Conference) {
    return `Region ${ROMAN[region - 1] ?? region}-${conference}`;
}

/** Narrows the "All schools" leaderboards to comparable schools. */
export type SchoolFilter = {
    conference?: Conference;
    region?: number;
    district?: number;
};

/**
 * Reads a SchoolFilter from URL search params, ignoring invalid values.
 * Region and district only count with a conference, since their numbers
 * repeat across conferences.
 */
export function parseSchoolFilter(params: {
    conference?: string | string[];
    region?: string | string[];
    district?: string | string[];
}): SchoolFilter {
    const conference = params.conference;
    if (!isConference(conference)) return {};

    const int = (value: string | string[] | undefined, max: number) => {
        const n = typeof value === "string" ? Number(value) : NaN;
        return Number.isInteger(n) && n >= 1 && n <= max ? n : undefined;
    };
    return {
        conference,
        region: int(params.region, REGIONS.length),
        district: int(params.district, MAX_DISTRICT),
    };
}
