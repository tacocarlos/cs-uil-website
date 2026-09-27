import { format } from "date-fns";
import type { ScoringMode } from "~/server/db/schema/contest";

export type { ScoringMode };

/** Form state for a contest's settings. Dates are datetime-local strings. */
export type ContestSettings = {
    name: string;
    description: string;
    startsAt: string;
    endsAt: string;
    scoringMode: ScoringMode;
    penaltyPoints: number;
};

export const EMPTY_CONTEST_SETTINGS: ContestSettings = {
    name: "",
    description: "",
    startsAt: "",
    endsAt: "",
    scoringMode: "simple",
    penaltyPoints: 20,
};

export const DEFAULT_MAX_POINTS = 60;

/** Build form state from a contest loaded from the server. */
export function settingsFromContest(contest: {
    name: string;
    description: string;
    startsAt: Date | string;
    endsAt: Date | string;
    scoringMode: ScoringMode;
    penaltyPoints: number;
}): ContestSettings {
    return {
        name: contest.name,
        description: contest.description,
        startsAt: toDatetimeLocal(contest.startsAt),
        endsAt: toDatetimeLocal(contest.endsAt),
        scoringMode: contest.scoringMode,
        penaltyPoints: contest.penaltyPoints,
    };
}

/** Returns a user-facing error message, or null if the settings are valid. */
export function validateSettings(settings: ContestSettings): string | null {
    if (!settings.name.trim()) return "Contest name is required";
    if (!settings.startsAt || !settings.endsAt) {
        return "Start and end date/times are required";
    }
    if (new Date(settings.startsAt) >= new Date(settings.endsAt)) {
        return "End time must be after start time";
    }
    return null;
}

/** Shape shared by the `contest.create` and `contest.update` inputs. */
export function settingsToMutationInput(settings: ContestSettings) {
    return {
        name: settings.name.trim(),
        description: settings.description,
        startsAt: new Date(settings.startsAt).toISOString(),
        endsAt: new Date(settings.endsAt).toISOString(),
        scoringMode: settings.scoringMode,
        penaltyPoints:
            settings.scoringMode === "penalty"
                ? settings.penaltyPoints
                : undefined,
    };
}

const LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Default problem label for a position: A, B, C, … then 27, 28, … */
export function autoLabel(index: number): string {
    return LABELS[index] ?? String(index + 1);
}

/** Format a date as the value a datetime-local input expects. */
function toDatetimeLocal(date: Date | string): string {
    return format(new Date(date), "yyyy-MM-dd'T'HH:mm");
}
