/**
 * How programming submissions are judged and scored: the single source of
 * truth for practice and contest scoring, and for what the site tells
 * students about it. Kept free of server imports so client components can
 * use it.
 */

/** Points a problem is worth unless a contest says otherwise, as in UIL. */
export const DEFAULT_MAX_POINTS = 60;

/**
 * Max Levenshtein distance between the program's output and the expected
 * output that still counts as accepted.
 */
export const ACCEPTANCE_DISTANCE_THRESHOLD = 5;

/** Full points minus a penalty per wrong attempt, never below zero. */
export function penalizedPoints(
    maxPoints: number,
    penaltyPerAttempt: number,
    wrongAttempts: number,
): number {
    return Math.max(0, maxPoints - penaltyPerAttempt * wrongAttempts);
}

export type PracticeScoring = "UIL" | "LENIENT" | "NO_PENALTY";

/** Points off per wrong attempt under each practice scoring rule. */
export const PRACTICE_PENALTIES: Record<PracticeScoring, number> = {
    UIL: 5,
    LENIENT: 1,
    NO_PENALTY: 0,
};

/** The rule practice submissions are scored by. */
export const PRACTICE_SCORING: PracticeScoring = "LENIENT";

/** Points for a practice problem accepted on its `attempt`th try. */
export function practicePoints(
    attempt: number,
    {
        maxPoints = DEFAULT_MAX_POINTS,
        scoring = PRACTICE_SCORING,
    }: { maxPoints?: number; scoring?: PracticeScoring } = {},
): number {
    return penalizedPoints(maxPoints, PRACTICE_PENALTIES[scoring], attempt - 1);
}
