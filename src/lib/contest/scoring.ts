import type { ScoringMode } from "~/server/db/schema/contest";

export type { ScoringMode };

/**
 * Points for a contest submission.
 * - simple: an accepted submission earns full points.
 * - penalty: full points minus `penaltyPoints` per earlier wrong attempt,
 *   never below zero (ICPC-style).
 * Rejected submissions always earn zero.
 */
export function contestPoints({
    accepted,
    maxPoints,
    scoringMode,
    penaltyPoints,
    wrongAttempts,
}: {
    accepted: boolean;
    maxPoints: number;
    scoringMode: ScoringMode;
    penaltyPoints: number;
    wrongAttempts: number;
}): number {
    if (!accepted) return 0;
    if (scoringMode === "simple") return maxPoints;
    return Math.max(0, maxPoints - wrongAttempts * penaltyPoints);
}

type ScoredSubmission = {
    apiProblemId: number;
    accepted: boolean;
    points: number;
};

/**
 * The best submission for each problem: accepted beats rejected, then higher
 * points win. Ties keep the earlier submission in `submissions` order.
 */
export function pickBestPerProblem<T extends ScoredSubmission>(
    submissions: T[],
): T[] {
    const best = new Map<number, T>();
    for (const sub of submissions) {
        const current = best.get(sub.apiProblemId);
        if (!current || isBetter(sub, current)) {
            best.set(sub.apiProblemId, sub);
        }
    }
    return Array.from(best.values());
}

function isBetter(a: ScoredSubmission, b: ScoredSubmission): boolean {
    if (a.accepted !== b.accepted) return a.accepted;
    return a.points > b.points;
}
