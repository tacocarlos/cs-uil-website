import { describe, expect, test } from "vitest";
import { DEFAULT_MAX_POINTS, penalizedPoints, practicePoints } from "./scoring";

describe("penalizedPoints", () => {
    test("deducts the penalty per wrong attempt", () => {
        expect(penalizedPoints(60, 5, 0)).toBe(60);
        expect(penalizedPoints(60, 5, 3)).toBe(45);
    });

    test("never goes below zero", () => {
        expect(penalizedPoints(60, 5, 12)).toBe(0);
        expect(penalizedPoints(60, 5, 100)).toBe(0);
    });
});

describe("practicePoints", () => {
    test("full points on the first try", () => {
        expect(practicePoints(1)).toBe(DEFAULT_MAX_POINTS);
        expect(practicePoints(1, { scoring: "UIL" })).toBe(DEFAULT_MAX_POINTS);
    });

    test("lenient by default: one point off per earlier attempt", () => {
        expect(practicePoints(4)).toBe(DEFAULT_MAX_POINTS - 3);
    });

    test("UIL: five points off per earlier attempt", () => {
        expect(practicePoints(4, { scoring: "UIL" })).toBe(
            DEFAULT_MAX_POINTS - 15,
        );
    });

    test("uses the problem's own maximum", () => {
        expect(practicePoints(2, { maxPoints: 100 })).toBe(99);
    });

    test("never goes below zero after many attempts", () => {
        expect(practicePoints(200)).toBe(0);
    });
});
