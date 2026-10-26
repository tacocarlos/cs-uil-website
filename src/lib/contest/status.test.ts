import { describe, expect, test } from "vitest";
import { type ContestStatus } from "~/server/db/schema/contest";
import { effectiveStatus } from "./status";

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
