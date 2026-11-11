import { describe, expect, test } from "vitest";
import {
    ACTIVITY_INTERVAL_MS,
    ActivityThrottle,
    addDays,
    buildRetention,
    dayInZone,
    daysEnding,
    fillDays,
    latestAction,
    signInMethod,
    weekStart,
} from "./analytics";

describe("dayInZone", () => {
    test("uses Central Time, not UTC", () => {
        // 03:00 UTC on Nov 10 is still Nov 9 in Texas.
        expect(dayInZone(new Date("2026-11-10T03:00:00Z"))).toBe("2026-11-09");
        expect(dayInZone(new Date("2026-11-10T12:00:00Z"))).toBe("2026-11-10");
    });
});

describe("day arithmetic", () => {
    test("addDays crosses months and years", () => {
        expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
        expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    });

    test("weekStart is the Monday on or before", () => {
        expect(weekStart("2026-11-09")).toBe("2026-11-09"); // Monday
        expect(weekStart("2026-11-15")).toBe("2026-11-09"); // Sunday
        expect(weekStart("2026-11-10")).toBe("2026-11-09");
    });

    test("daysEnding lists oldest first, ending on the given day", () => {
        expect(daysEnding("2026-11-02", 3)).toEqual([
            "2026-10-31",
            "2026-11-01",
            "2026-11-02",
        ]);
    });

    test("fillDays zero-fills missing days", () => {
        expect(
            fillDays(
                ["2026-11-01", "2026-11-02", "2026-11-03"],
                [{ day: "2026-11-02", count: 5 }],
            ),
        ).toEqual([0, 5, 0]);
    });
});

describe("buildRetention", () => {
    test("rates per week since sign-up, null for future weeks", () => {
        const rows = buildRetention(
            "2026-11-09",
            3,
            [
                { week: "2026-10-26", size: 4 },
                { week: "2026-11-09", size: 2 },
            ],
            [
                { week: "2026-10-26", offset: 0, count: 4 },
                { week: "2026-10-26", offset: 2, count: 1 },
                { week: "2026-11-09", offset: 0, count: 1 },
            ],
        );
        expect(rows).toEqual([
            { week: "2026-10-26", signUps: 4, rates: [1, 0, 0.25] },
            { week: "2026-11-02", signUps: 0, rates: [0, 0, null] },
            { week: "2026-11-09", signUps: 2, rates: [0.5, null, null] },
        ]);
    });
});

describe("signInMethod", () => {
    test("OAuth callbacks report the provider", () => {
        expect(
            signInMethod({ path: "/callback/:id", params: { id: "google" } }),
        ).toBe("google");
        expect(signInMethod({ path: "/callback/google" })).toBe("google");
    });

    test("sign-in routes report the route", () => {
        expect(signInMethod({ path: "/sign-in/username" })).toBe("username");
    });

    test("server-side sign-ups are username accounts", () => {
        expect(signInMethod({ path: "/sign-up/email" })).toBe("username");
    });

    test("other routes and missing context report nothing", () => {
        expect(signInMethod({ path: "/admin/impersonate-user" })).toBeNull();
        expect(signInMethod(null)).toBeNull();
    });
});

describe("latestAction", () => {
    const at = (minutes: number) =>
        new Date(Date.UTC(2026, 10, 10, 12, minutes));
    const signIn = {
        type: "sign-in" as const,
        method: "google",
        at: at(0),
    };

    test("describes auth events", () => {
        expect(latestAction(null, signIn)).toEqual({
            label: "Signed in with Google",
            at: at(0),
        });
        expect(
            latestAction(null, { type: "sign-out", method: null, at: at(0) })
                ?.label,
        ).toBe("Signed out");
    });

    test("page loads just after signing in don't hide the sign-in", () => {
        expect(latestAction(at(2), signIn)?.label).toBe(
            "Signed in with Google",
        );
    });

    test("later use of the site wins", () => {
        expect(latestAction(at(30), signIn)).toEqual({
            label: "Used the site",
            at: at(30),
        });
    });

    test("a sign-out after activity wins", () => {
        expect(
            latestAction(at(0), {
                type: "sign-out",
                method: null,
                at: at(1),
            })?.label,
        ).toBe("Signed out");
    });

    test("nothing recorded", () => {
        expect(latestAction(null, null)).toBeNull();
    });
});

describe("ActivityThrottle", () => {
    const noon = new Date("2026-11-10T18:00:00Z");

    test("records once per interval per user", () => {
        const throttle = new ActivityThrottle();
        expect(throttle.shouldRecord("a", noon)).toBe(true);
        expect(throttle.shouldRecord("a", noon)).toBe(false);
        expect(throttle.shouldRecord("b", noon)).toBe(true);
        const later = new Date(noon.getTime() + ACTIVITY_INTERVAL_MS);
        expect(throttle.shouldRecord("a", later)).toBe(true);
    });

    test("records again as soon as a new day starts", () => {
        const throttle = new ActivityThrottle();
        // 23:59 and 00:01 Central (05:59 and 06:01 UTC in November).
        expect(
            throttle.shouldRecord("a", new Date("2026-11-11T05:59:00Z")),
        ).toBe(true);
        expect(
            throttle.shouldRecord("a", new Date("2026-11-11T06:01:00Z")),
        ).toBe(true);
    });
});
