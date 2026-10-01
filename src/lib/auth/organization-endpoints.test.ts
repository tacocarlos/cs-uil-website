import { describe, expect, test } from "bun:test";
import { auth } from "auth";
import { env } from "~/env";
import {
    ALLOWED_ORGANIZATION_PATHS,
    isBlockedAuthPath,
} from "./organization-endpoints";

/** Every organization endpoint the plugin defines (e.g. after an upgrade). */
const organizationPaths = Object.values(auth.api)
    .map((endpoint) => (endpoint as { path?: string }).path)
    .filter((path): path is string => !!path?.startsWith("/organization/"));

/** Calls the real auth request handler, signed out. */
function request(method: "GET" | "POST", path: string) {
    return auth.handler(
        new Request(`${env.BASE_URL}/api/auth${path}`, {
            method,
            headers: {
                origin: env.BASE_URL,
                "content-type": "application/json",
            },
            body: method === "POST" ? "{}" : undefined,
        }),
    );
}

describe("organization plugin endpoints", () => {
    test("every allowed path is a real endpoint", () => {
        for (const path of ALLOWED_ORGANIZATION_PATHS) {
            expect(organizationPaths).toContain(path);
        }
    });

    test("every other organization endpoint is blocked", () => {
        // Sanity check that the plugin's endpoints were found at all.
        expect(organizationPaths.length).toBeGreaterThan(10);
        for (const path of organizationPaths) {
            expect(isBlockedAuthPath(path)).toBe(
                !ALLOWED_ORGANIZATION_PATHS.has(path),
            );
        }
    });

    test("only organization endpoints are affected", () => {
        expect(isBlockedAuthPath("/get-session")).toBe(false);
        expect(isBlockedAuthPath("/sign-in/social")).toBe(false);
    });

    test("blocked endpoints answer 404, before any sign-in check", async () => {
        // A sign-in check would answer 401, so 404 shows the block ran first.
        expect(
            (await request("GET", "/organization/list-members")).status,
        ).toBe(404);
        expect((await request("POST", "/organization/delete")).status).toBe(
            404,
        );
        expect(
            (await request("POST", "/organization/update-member-role")).status,
        ).toBe(404);
    });

    test("allowed endpoints reach the sign-in check", async () => {
        expect((await request("GET", "/organization/list")).status).toBe(401);
    });
});
