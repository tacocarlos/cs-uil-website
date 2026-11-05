import { describe, expect, test } from "vitest";
import type { Submission } from "~/server/db/schema/submission";
import type { ProblemProgress } from "~/lib/problems/status";
import { attemptedProblems } from "./attempted-problems";

function submission(
    problemId: number,
    time: string,
    accepted = false,
): Submission {
    return {
        id: `s${problemId}`,
        problemId,
        userId: "u",
        timeSubmitted: new Date(time),
        points: 0,
        maxPoints: 60,
        accepted,
        submittedCode: "",
        isStudentVisible: true,
        attemptNumber: 1,
    };
}

const progress: Record<number, ProblemProgress> = {
    1: { submission: submission(1, "2026-01-02"), started: true },
    2: { submission: submission(2, "2026-01-03", true), started: true },
    3: { submission: submission(3, "2026-01-01"), started: false },
    4: { submission: null, started: true },
    5: { submission: submission(5, "2026-01-04"), started: true },
};

const names = new Map([
    [1, "Alpha"],
    [2, "Bravo"],
    [3, "Charlie"],
    [4, "Delta"],
]);

const ids = (list: { problemId: number }[]) => list.map((p) => p.problemId);

describe("attemptedProblems", () => {
    test("keeps problems whose latest submission wasn't accepted", () => {
        expect(ids(attemptedProblems(progress, names, {}))).toEqual([5, 1, 3]);
    });

    test("sorts newest or oldest first", () => {
        expect(
            ids(attemptedProblems(progress, names, { sort: "oldest" })),
        ).toEqual([3, 1, 5]);
    });

    test("searches names ignoring case and surrounding spaces", () => {
        expect(
            ids(attemptedProblems(progress, names, { query: "  ALP " })),
        ).toEqual([1]);
        expect(
            ids(attemptedProblems(progress, names, { query: "bravo" })),
        ).toEqual([]);
    });

    test("names problems missing from the name list by ID", () => {
        const [first] = attemptedProblems(progress, names, {});
        expect(first?.name).toBe("Problem #5");
        expect(
            ids(attemptedProblems(progress, names, { query: "#5" })),
        ).toEqual([5]);
    });
});
