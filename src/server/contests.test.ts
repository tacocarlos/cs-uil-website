import { describe, expect, test } from "bun:test";
import { pickCompetingSchool } from "./contests";

const hosted = (
    visibility: "school" | "invite" | "open",
    invited: string[] = [],
) => ({ visibility, organizationId: "host", invited });

describe("pickCompetingSchool", () => {
    test("school contests: only the host school's members", () => {
        expect(pickCompetingSchool(hosted("school"), ["host"], "host")).toBe(
            "host",
        );
        expect(
            pickCompetingSchool(hosted("school"), ["other"], "other"),
        ).toBeUndefined();
        expect(pickCompetingSchool(hosted("school"), [], null)).toBeUndefined();
    });

    test("invite-only contests: the host and invited schools", () => {
        const contest = hosted("invite", ["guest"]);
        expect(pickCompetingSchool(contest, ["guest"], "guest")).toBe("guest");
        expect(
            pickCompetingSchool(contest, ["stranger"], "stranger"),
        ).toBeUndefined();
    });

    test("prefers the active school, else the earliest eligible one", () => {
        const contest = hosted("invite", ["guest"]);
        expect(
            pickCompetingSchool(contest, ["stranger", "guest", "host"], "host"),
        ).toBe("host");
        expect(
            pickCompetingSchool(
                contest,
                ["stranger", "guest", "host"],
                "stranger",
            ),
        ).toBe("guest");
    });

    test("open contests: any school, or none", () => {
        expect(pickCompetingSchool(hosted("open"), ["a", "b"], "b")).toBe("b");
        expect(pickCompetingSchool(hosted("open"), ["a", "b"], null)).toBe("a");
        expect(pickCompetingSchool(hosted("open"), [], null)).toBeNull();
    });
});
