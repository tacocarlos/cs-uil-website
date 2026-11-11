import { describe, expect, it } from "vitest";
import {
    enabledProviders,
    joinWithOr,
    listProviders,
    oauthCredentials,
} from "./oauth-providers";

describe("oauthCredentials", () => {
    it("enables providers with both variables set", () => {
        expect(
            oauthCredentials({
                GITHUB_CLIENT_ID: "id",
                GITHUB_CLIENT_SECRET: "secret",
            }),
        ).toEqual({ github: { clientId: "id", clientSecret: "secret" } });
    });

    it("enables nothing when no variables are set", () => {
        expect(oauthCredentials({})).toEqual({});
    });

    it("treats empty strings as unset", () => {
        expect(
            oauthCredentials({
                GOOGLE_CLIENT_ID: "",
                GOOGLE_CLIENT_SECRET: "",
            }),
        ).toEqual({});
    });

    it("refuses a provider with only one variable", () => {
        expect(() => oauthCredentials({ MICROSOFT_CLIENT_ID: "id" })).toThrow(
            /MICROSOFT_CLIENT_SECRET/,
        );
        expect(() =>
            oauthCredentials({ GOOGLE_CLIENT_SECRET: "secret" }),
        ).toThrow(/GOOGLE_CLIENT_ID/);
    });
});

describe("enabledProviders", () => {
    it("lists configured providers in display order", () => {
        const creds = { clientId: "id", clientSecret: "secret" };
        expect(enabledProviders({ microsoft: creds, google: creds })).toEqual([
            "google",
            "microsoft",
        ]);
    });
});

describe("joinWithOr", () => {
    it("joins any labels", () => {
        expect(joinWithOr(["a username"])).toBe("a username");
        expect(joinWithOr(["GitHub", "a username"])).toBe(
            "GitHub or a username",
        );
        expect(joinWithOr(["Google", "GitHub", "a username"])).toBe(
            "Google, GitHub, or a username",
        );
    });
});

describe("listProviders", () => {
    it("joins labels in a sentence", () => {
        expect(listProviders([])).toBe("");
        expect(listProviders(["github"])).toBe("GitHub");
        expect(listProviders(["google", "github"])).toBe("Google or GitHub");
        expect(listProviders(["google", "github", "microsoft"])).toBe(
            "Google, GitHub, or Microsoft",
        );
    });
});
