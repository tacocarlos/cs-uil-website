import { describe, expect, test } from "bun:test";
import { computeWrittenStatistics } from "./statistics";

const scores = [
    { userId: "ada", name: "Ada", score: 80 },
    { userId: "ada", name: "Ada", score: 60 },
    { userId: "alan", name: "Alan", score: 90 },
    { userId: "alan", name: "Alan", score: 40 },
    { userId: "grace", name: "Grace", score: 70 },
    { userId: "hasan", name: "Hasan", score: 50 },
];

describe("computeWrittenStatistics", () => {
    const stats = computeWrittenStatistics(scores);

    test("student optimal is the best score; expected is the average", () => {
        expect(
            stats.students.map(({ name, tests, optimal, expected }) => ({
                name,
                tests,
                optimal,
                expected,
            })),
        ).toEqual([
            { name: "Alan", tests: 2, optimal: 90, expected: 65 },
            { name: "Ada", tests: 2, optimal: 80, expected: 70 },
            { name: "Grace", tests: 1, optimal: 70, expected: 70 },
            { name: "Hasan", tests: 1, optimal: 50, expected: 50 },
        ]);
    });

    test("marks former students; others are current", () => {
        const withFormer = computeWrittenStatistics([
            { userId: "alan", name: "Alan", score: 90, former: true },
            { userId: "ada", name: "Ada", score: 80 },
        ]);
        expect(
            withFormer.students.map(({ name, former }) => ({ name, former })),
        ).toEqual([
            { name: "Alan", former: true },
            { name: "Ada", former: false },
        ]);
    });

    test("school optimal adds the three best optimals", () => {
        expect(stats.school.optimal.total).toBe(90 + 80 + 70);
        expect(stats.school.optimal.counted.map((s) => s.name)).toEqual([
            "Alan",
            "Ada",
            "Grace",
        ]);
    });

    test("school expected adds the three best expecteds, chosen separately", () => {
        // Ada and Grace (70) beat Alan (65) on expected, though not optimal.
        expect(stats.school.expected.total).toBe(70 + 70 + 65);
        expect(stats.school.expected.counted.map((s) => s.name)).toEqual([
            "Ada",
            "Grace",
            "Alan",
        ]);
    });

    test("fewer than three students count as many as there are", () => {
        const two = computeWrittenStatistics(scores.slice(0, 4));
        expect(two.school.optimal.total).toBe(90 + 80);
        expect(two.school.optimal.counted).toHaveLength(2);
    });

    test("no scores means no students and zero totals", () => {
        const none = computeWrittenStatistics([]);
        expect(none.students).toEqual([]);
        expect(none.school.optimal).toEqual({ total: 0, counted: [] });
        expect(none.school.expected).toEqual({ total: 0, counted: [] });
    });
});
