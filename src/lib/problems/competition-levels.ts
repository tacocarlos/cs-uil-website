/**
 * Programming competition levels, in season order. The single source of
 * truth for the level type, its display names and its badge styles.
 */
export const COMPETITION_LEVELS = [
    "invA",
    "invB",
    "district",
    "region",
    "state",
    "custom",
] as const;

export type CompetitionLevel = (typeof COMPETITION_LEVELS)[number];

export const COMPETITION_LEVEL_LABELS: Record<CompetitionLevel, string> = {
    invA: "Invitational A",
    invB: "Invitational B",
    district: "District",
    region: "Region",
    state: "State",
    custom: "Custom",
};

/** One-letter abbreviations, e.g. "A2019" for the 2019 Invitational A. */
export const COMPETITION_LEVEL_ABBREVIATIONS: Record<CompetitionLevel, string> =
    {
        invA: "A",
        invB: "B",
        district: "D",
        region: "R",
        state: "S",
        custom: "C",
    };

const DEFAULT_BADGE_CLASS = "bg-gray-100 text-gray-800 hover:bg-gray-200";

export const COMPETITION_LEVEL_BADGE_CLASSES: Record<CompetitionLevel, string> =
    {
        invA: DEFAULT_BADGE_CLASS,
        invB: DEFAULT_BADGE_CLASS,
        district: "bg-green-100 text-green-800 hover:bg-green-200",
        region: "bg-blue-100 text-blue-800 hover:bg-blue-200",
        state: "bg-purple-100 text-purple-800 hover:bg-purple-200",
        custom: DEFAULT_BADGE_CLASS,
    };
