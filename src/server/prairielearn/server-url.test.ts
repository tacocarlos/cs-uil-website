import { describe, expect, test } from "vitest";
import {
    isPublicAddress,
    normalizeServerUrl,
    resolvesToPublicAddresses,
} from "./server-url";

describe("normalizeServerUrl", () => {
    test.each([
        ["us.prairielearn.com", "https://us.prairielearn.com"],
        ["  https://pl.lunaghs.dev/  ", "https://pl.lunaghs.dev"],
        [
            "https://pl.lunaghs.dev/pl/course_instance/8/instructor",
            "https://pl.lunaghs.dev",
        ],
        ["https://pl.example.edu:8443", "https://pl.example.edu:8443"],
        ["HTTPS://PL.Example.EDU", "https://pl.example.edu"],
    ])("%s is %s", (input, origin) => {
        expect(normalizeServerUrl(input)).toBe(origin);
    });

    test.each([
        "",
        "http://pl.example.edu",
        "ftp://pl.example.edu",
        "javascript:alert(1)",
        "https://user:pass@pl.example.edu",
        "https://",
    ])("rejects %j", (input) => {
        expect(normalizeServerUrl(input)).toBeNull();
    });

    test("allows plain HTTP when asked (development)", () => {
        expect(
            normalizeServerUrl("http://localhost:3000", { allowHttp: true }),
        ).toBe("http://localhost:3000");
    });
});

describe("isPublicAddress", () => {
    test.each(["8.8.8.8", "5.161.225.112", "2606:4700:4700::1111"])(
        "%s is public",
        (address) => {
            expect(isPublicAddress(address)).toBe(true);
        },
    );

    test.each([
        "127.0.0.1",
        "10.1.2.3",
        "172.16.0.1",
        "172.31.255.255",
        "192.168.1.1",
        "169.254.169.254",
        "100.64.0.1",
        "0.0.0.0",
        "224.0.0.1",
        "255.255.255.255",
        "::1",
        "::",
        "fd00::1",
        "fe80::1",
        "::ffff:127.0.0.1",
        "::ffff:10.0.0.1",
        "not-an-ip",
    ])("%s isn't", (address) => {
        expect(isPublicAddress(address)).toBe(false);
    });
});

describe("resolvesToPublicAddresses", () => {
    test("checks IP addresses without looking them up", async () => {
        expect(await resolvesToPublicAddresses("127.0.0.1")).toBe(false);
        expect(await resolvesToPublicAddresses("[::1]")).toBe(false);
        expect(await resolvesToPublicAddresses("8.8.8.8")).toBe(true);
    });

    test("localhost isn't public", async () => {
        expect(await resolvesToPublicAddresses("localhost")).toBe(false);
    });

    test("names that don't resolve aren't public", async () => {
        expect(await resolvesToPublicAddresses("pl.invalid")).toBe(false);
    });
});
