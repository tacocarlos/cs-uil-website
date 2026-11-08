import { describe, expect, test } from "vitest";
import { admin } from "better-auth/plugins";
import { isBanActive } from "./bans";
import { accessControl, adminPluginRoles } from "./permissions";
import { USER_ROLES } from "./roles";

describe("admin plugin roles", () => {
    test("the plugin accepts site-admin as its admin role", () => {
        // admin() throws if an adminRole isn't defined in `roles`.
        expect(() =>
            admin({
                ac: accessControl,
                roles: adminPluginRoles,
                adminRoles: ["site-admin"],
                defaultRole: "student",
            }),
        ).not.toThrow();
    });

    test.each(USER_ROLES)("%s can ban only if a site admin", (role) => {
        const { success } = adminPluginRoles[role].authorize({
            user: ["ban"],
        });
        expect(success).toBe(role === "site-admin");
    });
});

describe("isBanActive", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    const later = new Date("2026-01-02T12:00:00Z");
    const earlier = new Date("2025-12-31T12:00:00Z");

    test.each([
        [{ banned: false, banExpires: null }, false],
        [{ banned: null, banExpires: null }, false],
        [{ banned: true, banExpires: null }, true],
        [{ banned: true, banExpires: later }, true],
        // Expired, but not yet cleared by the user signing in.
        [{ banned: true, banExpires: earlier }, false],
    ])("%o → %s", (user, active) => {
        expect(isBanActive(user, now)).toBe(active);
    });
});
