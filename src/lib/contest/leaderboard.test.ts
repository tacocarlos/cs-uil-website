import { describe, expect, test } from "bun:test";
import { buildLeaderboard, type LeaderboardSubmission } from "./leaderboard";

const at = (minute: number) => new Date(Date.UTC(2026, 0, 1, 0, minute));

function sub(
    userId: string,
    apiProblemId: number,
    accepted: boolean,
    points: number,
    minute: number,
): LeaderboardSubmission {
    return {
        userId,
        userName: userId.toUpperCase(),
        apiProblemId,
        accepted,
        points,
        submittedAt: at(minute),
    };
}

const labels = new Map([
    [1, "A"],
    [2, "B"],
]);

describe("buildLeaderboard", () => {
    test("ranks by total points", () => {
        const rows = buildLeaderboard(
            [
                sub("ann", 1, true, 60, 1),
                sub("bob", 1, true, 60, 2),
                sub("bob", 2, true, 40, 3),
            ],
            labels,
        );
        expect(rows.map((r) => [r.userId, r.totalPoints])).toEqual([
            ["bob", 100],
            ["ann", 60],
        ]);
    });

    test("breaks ties by who finished first", () => {
        const rows = buildLeaderboard(
            [sub("ann", 1, true, 60, 5), sub("bob", 1, true, 60, 2)],
            labels,
        );
        expect(rows.map((r) => r.userId)).toEqual(["bob", "ann"]);
    });

    test("counts only the first accept but every attempt", () => {
        const [row] = buildLeaderboard(
            [
                sub("ann", 1, false, 0, 1),
                sub("ann", 1, true, 40, 2),
                sub("ann", 1, true, 60, 3),
            ],
            labels,
        );
        expect(row).toMatchObject({
            totalPoints: 40,
            solvedCount: 1,
            lastSolveTime: at(2),
        });
        expect(row!.problems).toEqual([
            {
                apiProblemId: 1,
                label: "A",
                accepted: true,
                points: 40,
                attempts: 3,
            },
        ]);
    });

    test("falls back to the problem ID when a label is missing", () => {
        const [row] = buildLeaderboard([sub("ann", 99, false, 0, 1)], labels);
        expect(row!.problems[0]!.label).toBe("99");
    });

    test("users with no solves rank below users with solves", () => {
        const rows = buildLeaderboard(
            [sub("ann", 1, false, 0, 1), sub("bob", 1, true, 60, 2)],
            labels,
        );
        expect(rows.map((r) => r.userId)).toEqual(["bob", "ann"]);
    });
});
