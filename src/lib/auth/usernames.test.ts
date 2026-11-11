import { describe, expect, test } from "vitest";
import {
    accountLabel,
    isBlockedEmailPath,
    isPlaceholderEmail,
    passwordProblem,
    placeholderEmail,
    usernameProblem,
} from "./usernames";

describe("placeholder emails", () => {
    test("are recognized, real addresses aren't", () => {
        expect(isPlaceholderEmail(placeholderEmail("abc"))).toBe(true);
        expect(isPlaceholderEmail("ABC@USERNAME.INVALID")).toBe(true);
        expect(isPlaceholderEmail("student@school.org")).toBe(false);
        expect(isPlaceholderEmail("x@notusername.invalid")).toBe(false);
    });
});

describe("accountLabel", () => {
    test("shows real emails", () => {
        expect(accountLabel({ email: "t@school.org", username: null })).toBe(
            "t@school.org",
        );
    });

    test("shows @username, as typed, for username accounts", () => {
        expect(
            accountLabel({
                email: placeholderEmail("abc"),
                username: "jane.doe",
                displayUsername: "Jane.Doe",
            }),
        ).toBe("@Jane.Doe");
        expect(
            accountLabel({ email: placeholderEmail("abc"), username: "jane" }),
        ).toBe("@jane");
    });
});

describe("validation", () => {
    test("usernames", () => {
        expect(usernameProblem("jane_doe.2")).toBeNull();
        expect(usernameProblem("ab")).toMatch(/at least/);
        expect(usernameProblem("a".repeat(31))).toMatch(/at most/);
        expect(usernameProblem("jane doe")).toMatch(/only use/);
        expect(usernameProblem("jane@school")).toMatch(/only use/);
    });

    test("passwords", () => {
        expect(passwordProblem("12345678")).toBeNull();
        expect(passwordProblem("1234567")).toMatch(/at least/);
    });
});

describe("isBlockedEmailPath", () => {
    test("blocks email sign-in, sign-up, and email flows", () => {
        for (const path of [
            "/sign-in/email",
            "/sign-up/email",
            "/change-email",
            "/request-password-reset",
            "/reset-password/some-token",
            "/send-verification-email",
        ]) {
            expect(isBlockedEmailPath(path)).toBe(true);
        }
    });

    test("allows username and Google sign-in", () => {
        for (const path of [
            "/sign-in/username",
            "/sign-in/social",
            "/callback/:id",
            "/get-session",
            "/sign-out",
        ]) {
            expect(isBlockedEmailPath(path)).toBe(false);
        }
    });
});
