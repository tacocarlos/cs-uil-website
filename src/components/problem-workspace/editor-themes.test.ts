import { describe, expect, test } from "vitest";
import {
    adaptTheme,
    DEFAULT_THEME_ID,
    EDITOR_THEMES,
    findTheme,
    loadThemeData,
    type EditorThemeData,
} from "./editor-themes";

describe("EDITOR_THEMES", () => {
    test("IDs are unique", () => {
        const ids = EDITOR_THEMES.map((t) => t.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    // Also checks every import resolves through the path alias.
    test.each(EDITOR_THEMES.filter((t) => t.load))(
        "$name loads and matches its listing",
        async (theme) => {
            const data = await loadThemeData(theme)!;
            expect(data.base).toBe(theme.kind === "light" ? "vs" : "vs-dark");
            expect(data.colors["editor.background"]?.toLowerCase()).toBe(
                theme.background,
            );
        },
    );
});

describe("findTheme", () => {
    test("falls back to the default for unknown IDs", () => {
        expect(findTheme("dracula").name).toBe("Dracula");
        expect(findTheme("removed-theme").id).toBe(DEFAULT_THEME_ID);
    });
});

describe("adaptTheme", () => {
    const theme = (rules: EditorThemeData["rules"]): EditorThemeData => ({
        base: "vs-dark",
        inherit: true,
        rules,
        colors: {},
    });

    test("colors Monaco's token names like their TextMate scopes", () => {
        const rules = adaptTheme(
            theme([
                { token: "constant.numeric", foreground: "bd93f9" },
                {
                    token: "storage.type",
                    foreground: "8be9fd",
                    fontStyle: "italic",
                },
            ]),
        ).rules;
        expect(rules).toContainEqual({ token: "number", foreground: "bd93f9" });
        expect(rules).toContainEqual({
            token: "type",
            foreground: "8be9fd",
            fontStyle: "italic",
        });
    });

    test("keeps the theme's own rules for those names", () => {
        const rules = adaptTheme(
            theme([
                { token: "number", foreground: "111111" },
                { token: "constant.numeric", foreground: "222222" },
            ]),
        ).rules;
        expect(rules.filter((r) => r.token === "number")).toEqual([
            { token: "number", foreground: "111111" },
        ]);
    });
});
