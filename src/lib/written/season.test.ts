import { describe, expect, test } from "vitest";
import { currentSeasonYear, parseSeasonYear, seasonYearOf } from "./season";

describe("seasonYearOf", () => {
    test("fall dates are in the season ending the next year", () => {
        expect(seasonYearOf("2026-08-01")).toBe(2027);
        expect(seasonYearOf("2026-10-17")).toBe(2027);
        expect(seasonYearOf("2026-12-31")).toBe(2027);
    });

    test("spring and summer dates are in the season ending that year", () => {
        expect(seasonYearOf("2027-01-01")).toBe(2027);
        expect(seasonYearOf("2027-04-25")).toBe(2027);
        expect(seasonYearOf("2027-07-31")).toBe(2027);
    });

    test("reads full ISO timestamps by their date part", () => {
        expect(seasonYearOf("2026-07-31T23:59:59.000Z")).toBe(2026);
        expect(seasonYearOf("2026-08-01T00:00:00.000Z")).toBe(2027);
    });

    test("reads Date objects by their local date", () => {
        expect(seasonYearOf(new Date(2026, 6, 31))).toBe(2026);
        expect(seasonYearOf(new Date(2026, 7, 1))).toBe(2027);
    });
});

describe("parseSeasonYear", () => {
    test('"all" means every season', () => {
        expect(parseSeasonYear("all")).toBeUndefined();
    });

    test("reads a year", () => {
        expect(parseSeasonYear("2025")).toBe(2025);
    });

    test("anything else is the current season", () => {
        for (const value of [undefined, "", "current", "2025.5", "abc"]) {
            expect(parseSeasonYear(value)).toBe(currentSeasonYear());
        }
    });
});
