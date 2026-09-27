import { describe, expect, test } from "bun:test";
import { contestPoints, pickBestPerProblem } from "./scoring";

describe("contestPoints", () => {
    const base = {
        maxPoints: 60,
        penaltyPoints: 20,
        wrongAttempts: 2,
    };

    test("rejected submissions earn nothing", () => {
        expect(
            contestPoints({ ...base, accepted: false, scoringMode: "simple" }),
        ).toBe(0);
        expect(
            contestPoints({ ...base, accepted: false, scoringMode: "penalty" }),
        ).toBe(0);
    });

    test("simple mode ignores wrong attempts", () => {
        expect(
            contestPoints({ ...base, accepted: true, scoringMode: "simple" }),
        ).toBe(60);
    });

    test("penalty mode deducts per wrong attempt", () => {
        expect(
            contestPoints({ ...base, accepted: true, scoringMode: "penalty" }),
        ).toBe(20);
    });

    test("penalty mode never goes below zero", () => {
        expect(
            contestPoints({
                ...base,
                accepted: true,
                scoringMode: "penalty",
                wrongAttempts: 10,
            }),
        ).toBe(0);
    });
});

describe("pickBestPerProblem", () => {
    test("accepted beats a higher-scoring rejection", () => {
        const best = pickBestPerProblem([
            { apiProblemId: 1, accepted: false, points: 50, id: "a" },
            { apiProblemId: 1, accepted: true, points: 10, id: "b" },
        ]);
        expect(best.map((s) => s.id)).toEqual(["b"]);
    });

    test("higher points win among equally accepted submissions", () => {
        const best = pickBestPerProblem([
            { apiProblemId: 1, accepted: true, points: 20, id: "a" },
            { apiProblemId: 1, accepted: true, points: 40, id: "b" },
        ]);
        expect(best.map((s) => s.id)).toEqual(["b"]);
    });

    test("ties keep the earlier submission", () => {
        const best = pickBestPerProblem([
            { apiProblemId: 1, accepted: true, points: 40, id: "a" },
            { apiProblemId: 1, accepted: true, points: 40, id: "b" },
        ]);
        expect(best.map((s) => s.id)).toEqual(["a"]);
    });

    test("returns one entry per problem", () => {
        const best = pickBestPerProblem([
            { apiProblemId: 1, accepted: false, points: 0, id: "a" },
            { apiProblemId: 2, accepted: true, points: 60, id: "b" },
            { apiProblemId: 1, accepted: true, points: 60, id: "c" },
        ]);
        expect(best.map((s) => s.id).sort()).toEqual(["b", "c"]);
    });
});
