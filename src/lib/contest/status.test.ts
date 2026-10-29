import { describe, expect, test } from "vitest";
import {
    canTransition,
    CONTEST_STATUSES,
    effectiveStatus,
    isEnrollable,
    isInProgress,
    type ContestStatus,
} from "./status";

const startsAt = new Date("2026-11-07T09:00:00Z");
const endsAt = new Date("2026-11-07T11:00:00Z");
const before = new Date("2026-11-07T08:59:59Z");
const during = new Date("2026-11-07T10:00:00Z");

const at = (status: ContestStatus, now: Date) =>
    effectiveStatus({ status, startsAt, endsAt }, now);

describe("effectiveStatus", () => {
    test("scheduled contests start on their own at startsAt", () => {
        expect(at("scheduled", before)).toBe("scheduled");
        expect(at("scheduled", startsAt)).toBe("active");
        expect(at("scheduled", during)).toBe("active");
    });

    test("published contests end on their own at endsAt", () => {
        for (const status of ["scheduled", "active", "frozen"] as const) {
            expect(at(status, endsAt)).toBe("ended");
        }
    });

    test("drafts never start or end", () => {
        expect(at("draft", during)).toBe("draft");
        expect(at("draft", endsAt)).toBe("draft");
    });

    test("statuses set by hand last until the end", () => {
        // Started early, frozen, or ended early.
        expect(at("active", before)).toBe("active");
        expect(at("frozen", during)).toBe("frozen");
        expect(at("ended", during)).toBe("ended");
    });
});

describe("canTransition", () => {
    test("allows each step forward that managers take by hand", () => {
        expect(canTransition("draft", "scheduled")).toBe(true);
        expect(canTransition("scheduled", "active")).toBe(true);
        expect(canTransition("active", "frozen")).toBe(true);
        expect(canTransition("active", "ended")).toBe(true);
        expect(canTransition("frozen", "ended")).toBe(true);
    });

    test("refuses going back, skipping ahead, or staying put", () => {
        expect(canTransition("ended", "draft")).toBe(false);
        expect(canTransition("ended", "active")).toBe(false);
        expect(canTransition("frozen", "active")).toBe(false);
        expect(canTransition("scheduled", "draft")).toBe(false);
        expect(canTransition("draft", "active")).toBe(false);
        for (const status of CONTEST_STATUSES) {
            expect(canTransition(status, status)).toBe(false);
        }
    });
});

describe("status groups", () => {
    const where = (test: (s: ContestStatus) => boolean) =>
        CONTEST_STATUSES.filter(test);

    test("in progress: active and frozen", () => {
        expect(where(isInProgress)).toEqual(["active", "frozen"]);
    });

    test("enrollable: scheduled and active", () => {
        expect(where(isEnrollable)).toEqual(["scheduled", "active"]);
    });
});
