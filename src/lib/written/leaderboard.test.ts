import { describe, expect, test } from "vitest";
import {
    compareWrittenTotals,
    formatAccuracy,
    totalWrittenScores,
} from "./leaderboard";

describe("totalWrittenScores", () => {
    test("totals scores and averages accuracy per student", () => {
        expect(
            totalWrittenScores([
                { userId: "ada", name: "Ada", score: 80, accuracy: 1 },
                { userId: "ada", name: "Ada", score: 60, accuracy: 0.5 },
                { userId: "alan", name: "Alan", score: 90, accuracy: 0.9 },
            ]),
        ).toEqual([
            {
                id: "ada",
                userId: "ada",
                name: "Ada",
                score: 140,
                accuracy: 0.75,
            },
            {
                id: "alan",
                userId: "alan",
                name: "Alan",
                score: 90,
                accuracy: 0.9,
            },
        ]);
    });

    test("breaks score ties by accuracy", () => {
        const ranked = totalWrittenScores([
            { userId: "ada", name: "Ada", score: 100, accuracy: 0.8 },
            { userId: "alan", name: "Alan", score: 100, accuracy: 0.95 },
            { userId: "grace", name: "Grace", score: 120, accuracy: 0.5 },
        ]);
        expect(ranked.map((r) => r.name)).toEqual(["Grace", "Alan", "Ada"]);
    });
});

test("compareWrittenTotals puts higher scores, then accuracy, first", () => {
    const totals = [
        { score: 90, accuracy: 1 },
        { score: 100, accuracy: 0.5 },
        { score: 100, accuracy: 0.9 },
    ];
    expect(totals.sort(compareWrittenTotals)).toEqual([
        { score: 100, accuracy: 0.9 },
        { score: 100, accuracy: 0.5 },
        { score: 90, accuracy: 1 },
    ]);
});

test("formatAccuracy shows a percentage", () => {
    expect(formatAccuracy(0.875)).toBe("87.5%");
    expect(formatAccuracy(1)).toBe("100.0%");
});
