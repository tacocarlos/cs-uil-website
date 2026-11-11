import { describe, expect, test } from "vitest";
import { assertReachableServer, PrairieLearnError } from "./api";

// Tests don't run in development, so the address checks apply.
describe("assertReachableServer", () => {
    test.each([
        "http://pl.example.edu",
        "https://127.0.0.1",
        "https://169.254.169.254",
        "https://[::1]",
        "https://localhost:3000",
        "https://10.0.0.5",
        "https://pl.invalid",
    ])("refuses %s", async (serverUrl) => {
        await expect(assertReachableServer(serverUrl)).rejects.toBeInstanceOf(
            PrairieLearnError,
        );
    });

    test("allows a public HTTPS address", async () => {
        await expect(
            assertReachableServer("https://8.8.8.8"),
        ).resolves.toBeUndefined();
    });
});
