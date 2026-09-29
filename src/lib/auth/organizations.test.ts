import { describe, expect, test } from "bun:test";
import { memberRoleFor } from "./organizations";

describe("memberRoleFor", () => {
    test("maps global roles to school roles", () => {
        expect(memberRoleFor("site-admin")).toBe("owner");
        expect(memberRoleFor("teacher")).toBe("admin");
        expect(memberRoleFor("student")).toBe("member");
    });

    test("treats unknown or missing roles as students", () => {
        expect(memberRoleFor(null)).toBe("member");
        expect(memberRoleFor(undefined)).toBe("member");
        expect(memberRoleFor("admin")).toBe("member");
    });
});
