/** One written test's result, as the leaderboards total them. */
export type WrittenScoreRow = {
    userId: string;
    score: number;
    /** The share of attempted questions answered correctly, 0–1. */
    accuracy: number;
};

/** A student's total over the tests a leaderboard counts. */
export type WrittenTotal = {
    score: number;
    /** The average accuracy over those tests, 0–1. */
    accuracy: number;
};

/**
 * Leaderboard order: highest total score first, ties broken by higher
 * average accuracy.
 */
export function compareWrittenTotals(a: WrittenTotal, b: WrittenTotal) {
    return b.score - a.score || b.accuracy - a.accuracy;
}

/**
 * Totals each student's scores and averages their accuracy, in leaderboard
 * order, with the student's ID as `id`. Other fields (e.g. name) are taken
 * from the student's last row.
 */
export function totalWrittenScores<R extends WrittenScoreRow>(
    rows: R[],
): (R & WrittenTotal & { id: string })[] {
    const totals = new Map<
        string,
        { row: R; score: number; accuracySum: number; tests: number }
    >();
    for (const row of rows) {
        const total = totals.get(row.userId);
        totals.set(row.userId, {
            row,
            score: (total?.score ?? 0) + row.score,
            accuracySum: (total?.accuracySum ?? 0) + row.accuracy,
            tests: (total?.tests ?? 0) + 1,
        });
    }

    return Array.from(totals.values())
        .map(({ row, score, accuracySum, tests }) => ({
            ...row,
            id: row.userId,
            score,
            accuracy: accuracySum / tests,
        }))
        .sort(compareWrittenTotals);
}

/** An accuracy as a percentage for display, e.g. "87.5%". */
export function formatAccuracy(accuracy: number): string {
    return `${(accuracy * 100).toFixed(1)}%`;
}
