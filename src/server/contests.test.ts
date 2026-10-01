import { describe, expect, test } from "bun:test";
import { canSeeProblems, pickCompetingSchool } from "./contests";

describe("canSeeProblems", () => {
    const at = (
        status: "draft" | "scheduled" | "active" | "frozen" | "ended",
    ) => ({ status, organizationId: "host" }) as const;
    const hostTeacher = { organizationId: "host", role: "admin" } as const;
    const hostStudent = { organizationId: "host", role: "member" } as const;
    const otherTeacher = { organizationId: "other", role: "owner" } as const;

    test("everyone once the contest has started", () => {
        for (const status of ["active", "frozen", "ended"] as const) {
            expect(canSeeProblems(at(status), null)).toBe(true);
            expect(canSeeProblems(at(status), hostStudent)).toBe(true);
        }
    });

    test("before the start, only the host school's teachers", () => {
        for (const status of ["draft", "scheduled"] as const) {
            expect(canSeeProblems(at(status), hostTeacher)).toBe(true);
            expect(canSeeProblems(at(status), hostStudent)).toBe(false);
            expect(canSeeProblems(at(status), otherTeacher)).toBe(false);
            expect(canSeeProblems(at(status), null)).toBe(false);
        }
    });
});

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
