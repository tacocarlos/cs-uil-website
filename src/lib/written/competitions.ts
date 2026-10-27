/**
 * Written competitions, in season order: each stored value (the database
 * enum) and its display name. The single source of truth for both; the
 * schema, inputs and pickers all derive from it.
 */
export const COMPETITION_LABELS = {
    "VCM-1": "VCM 1",
    "VCM-2": "VCM 2",
    "VCM-3": "VCM 3",
    "VCM-4": "VCM 4",
    invA: "Invitational A",
    invB: "Invitational B",
    district: "District",
    region: "Region",
    state: "State",
} as const;

export type WrittenCompetition = keyof typeof COMPETITION_LABELS;

/** The stored competition values, in season order. */
export const WRITTEN_COMPETITIONS = Object.keys(COMPETITION_LABELS) as [
    WrittenCompetition,
    ...WrittenCompetition[],
];

/** A competition's display name, e.g. "Invitational A" for "invA". */
export function competitionLabel(competition: WrittenCompetition): string {
    return COMPETITION_LABELS[competition];
}
