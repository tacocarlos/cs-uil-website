import { describe, expect, test } from "bun:test";
import { districtLabel, parseSchoolFilter, regionLabel } from "./schools";

describe("parseSchoolFilter", () => {
    test("reads conference, region, and district", () => {
        expect(
            parseSchoolFilter({
                conference: "2A",
                region: "3",
                district: "23",
            }),
        ).toEqual({ conference: "2A", region: 3, district: 23 });
    });

    test("ignores region and district without a conference", () => {
        expect(parseSchoolFilter({ region: "3", district: "23" })).toEqual({});
    });

    test("drops invalid values", () => {
        expect(parseSchoolFilter({ conference: "7A" })).toEqual({});
        expect(
            parseSchoolFilter({
                conference: "4A",
                region: "5",
                district: "2.5",
            }),
        ).toEqual({ conference: "4A", region: undefined, district: undefined });
        expect(
            parseSchoolFilter({ conference: ["2A", "3A"], district: "0" }),
        ).toEqual({});
    });
});

test("labels follow UIL's naming", () => {
    expect(districtLabel(23, "2A")).toBe("District 23-2A");
    expect(regionLabel(2, "5A")).toBe("Region II-5A");
});
