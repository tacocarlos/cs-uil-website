export type LeaderboardSubmission = {
    userId: string;
    userName: string;
    apiProblemId: number;
    accepted: boolean;
    points: number;
    submittedAt: Date;
};

export type LeaderboardProblem = {
    apiProblemId: number;
    label: string;
    accepted: boolean;
    points: number;
    attempts: number;
};

export type LeaderboardRow = {
    userId: string;
    userName: string;
    totalPoints: number;
    solvedCount: number;
    /** When the user's most recent first-accept happened; tiebreaker. */
    lastSolveTime: Date | null;
    problems: LeaderboardProblem[];
};

/**
 * Ranks users by total points, breaking ties by who reached that total
 * first. Only a problem's first accepted submission counts; later ones are
 * still counted as attempts.
 *
 * `submissions` must be sorted oldest first.
 */
export function buildLeaderboard(
    submissions: LeaderboardSubmission[],
    labels: Map<number, string>,
): LeaderboardRow[] {
    const rows = new Map<
        string,
        Omit<LeaderboardRow, "problems"> & {
            problems: Map<number, LeaderboardProblem>;
        }
    >();

    for (const sub of submissions) {
        let row = rows.get(sub.userId);
        if (!row) {
            row = {
                userId: sub.userId,
                userName: sub.userName,
                totalPoints: 0,
                solvedCount: 0,
                lastSolveTime: null,
                problems: new Map(),
            };
            rows.set(sub.userId, row);
        }

        let problem = row.problems.get(sub.apiProblemId);
        if (!problem) {
            problem = {
                apiProblemId: sub.apiProblemId,
                label: labels.get(sub.apiProblemId) ?? String(sub.apiProblemId),
                accepted: false,
                points: 0,
                attempts: 0,
            };
            row.problems.set(sub.apiProblemId, problem);
        }

        problem.attempts++;

        if (sub.accepted && !problem.accepted) {
            problem.accepted = true;
            problem.points = sub.points;
            row.totalPoints += sub.points;
            row.solvedCount++;
            row.lastSolveTime = sub.submittedAt;
        }
    }

    return Array.from(rows.values())
        .map((row) => ({ ...row, problems: Array.from(row.problems.values()) }))
        .sort(
            (a, b) =>
                b.totalPoints - a.totalPoints ||
                (a.lastSolveTime?.getTime() ?? 0) -
                    (b.lastSolveTime?.getTime() ?? 0),
        );
}
