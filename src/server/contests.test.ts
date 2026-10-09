import { describe, expect, test } from "bun:test";
import {
    canManageContest,
    canSeeProblems,
    contestManagerFor,
    pickCompetingSchool,
} from "./contests";

// Contest managers (students aren't any: null).
const hostTeacher = { siteAdmin: false, organizationId: "host" };
const otherTeacher = { siteAdmin: false, organizationId: "other" };
const siteAdmin = { siteAdmin: true, organizationId: null };

const schoolContest = { organizationId: "host" };
const globalContest = { organizationId: null };

describe("contestManagerFor", () => {
    test("teachers manage as their active school", () => {
        expect(
            contestManagerFor(
                { role: "student" },
                { organizationId: "host", role: "admin" },
            ),
        ).toEqual(hostTeacher);
    });

    test("students aren't teachers, even with an active school", () => {
        expect(
            contestManagerFor(
                { role: "student" },
                { organizationId: "host", role: "member" },
            ),
        ).toEqual({ siteAdmin: false, organizationId: null });
    });

    test("site admins are recognized without a school", () => {
        expect(contestManagerFor({ role: "site-admin" }, null)).toEqual(
            siteAdmin,
        );
    });
});

describe("canManageContest", () => {
    test("the host school's teachers manage its contests", () => {
        expect(canManageContest(schoolContest, hostTeacher)).toBe(true);
        expect(canManageContest(schoolContest, otherTeacher)).toBe(false);
        expect(canManageContest(schoolContest, null)).toBe(false);
    });

    test("only site admins manage global contests", () => {
        expect(canManageContest(globalContest, hostTeacher)).toBe(false);
        expect(canManageContest(globalContest, siteAdmin)).toBe(true);
    });

    test("site admins manage every school's contests", () => {
        expect(canManageContest(schoolContest, siteAdmin)).toBe(true);
    });
});

describe("canSeeProblems", () => {
    const at = (
        status: "draft" | "scheduled" | "active" | "frozen" | "ended",
    ) => ({ status, organizationId: "host" }) as const;

    test("everyone once the contest has started", () => {
        for (const status of ["active", "frozen", "ended"] as const) {
            expect(canSeeProblems(at(status), null)).toBe(true);
            expect(canSeeProblems(at(status), otherTeacher)).toBe(true);
        }
    });

    test("before the start, only those who manage the contest", () => {
        for (const status of ["draft", "scheduled"] as const) {
            expect(canSeeProblems(at(status), hostTeacher)).toBe(true);
            expect(canSeeProblems(at(status), siteAdmin)).toBe(true);
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
