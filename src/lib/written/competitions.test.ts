import { describe, expect, test } from "vitest";
import { inSeasonOrder } from "./competitions";

describe("inSeasonOrder", () => {
    test("sorts by when competitions happen, not alphabetically", () => {
        expect(
            inSeasonOrder(["state", "district", "invB", "VCM-2", "invA"]),
        ).toEqual(["VCM-2", "invA", "invB", "district", "state"]);
    });

    test("leaves its argument alone", () => {
        const competitions = ["state", "district"] as const;
        inSeasonOrder([...competitions]);
        expect(competitions).toEqual(["state", "district"]);
    });
});
