/**
 * Editor color themes: Monaco's built-ins plus a selection from
 * monaco-themes. Each monaco-themes theme is its own chunk, loaded when
 * picked.
 *
 * monaco-themes doesn't export its JSON files, so they're imported through
 * the `monaco-themes-json/*` path alias (tsconfig.json).
 */
import type { editor } from "monaco-editor";

export type EditorThemeData = editor.IStandaloneThemeData;

export type EditorTheme = {
    id: string;
    name: string;
    kind: "dark" | "light";
    /** editor.background, so the loading placeholder matches */
    background: string;
    /** Absent for Monaco's built-in themes. */
    load?: () => Promise<{ default: unknown }>;
};

export const DEFAULT_THEME_ID = "vs-dark";

export const EDITOR_THEMES: readonly EditorTheme[] = [
    // Monaco's own
    {
        id: "vs-dark",
        name: "Dark (default)",
        kind: "dark",
        background: "#1e1e1e",
    },
    { id: "vs", name: "Light", kind: "light", background: "#fffffe" },
    {
        id: "hc-black",
        name: "High Contrast Dark",
        kind: "dark",
        background: "#000000",
    },
    {
        id: "hc-light",
        name: "High Contrast Light",
        kind: "light",
        background: "#ffffff",
    },
    // monaco-themes, dark
    {
        id: "cobalt2",
        name: "Cobalt2",
        kind: "dark",
        background: "#193549",
        load: () => import("monaco-themes-json/Cobalt2.json"),
    },
    {
        id: "dracula",
        name: "Dracula",
        kind: "dark",
        background: "#282a36",
        load: () => import("monaco-themes-json/Dracula.json"),
    },
    {
        id: "github-dark",
        name: "GitHub Dark",
        kind: "dark",
        background: "#24292e",
        load: () => import("monaco-themes-json/GitHub Dark.json"),
    },
    {
        id: "monokai",
        name: "Monokai",
        kind: "dark",
        background: "#272822",
        load: () => import("monaco-themes-json/Monokai.json"),
    },
    {
        id: "night-owl",
        name: "Night Owl",
        kind: "dark",
        background: "#011627",
        load: () => import("monaco-themes-json/Night Owl.json"),
    },
    {
        id: "nord",
        name: "Nord",
        kind: "dark",
        background: "#2e3440",
        load: () => import("monaco-themes-json/Nord.json"),
    },
    {
        id: "oceanic-next",
        name: "Oceanic Next",
        kind: "dark",
        background: "#1b2b34",
        load: () => import("monaco-themes-json/Oceanic Next.json"),
    },
    {
        id: "solarized-dark",
        name: "Solarized Dark",
        kind: "dark",
        background: "#002b36",
        load: () => import("monaco-themes-json/Solarized-dark.json"),
    },
    {
        id: "tomorrow-night",
        name: "Tomorrow Night",
        kind: "dark",
        background: "#1d1f21",
        load: () => import("monaco-themes-json/Tomorrow-Night.json"),
    },
    {
        id: "tomorrow-night-blue",
        name: "Tomorrow Night Blue",
        kind: "dark",
        background: "#002451",
        load: () => import("monaco-themes-json/Tomorrow-Night-Blue.json"),
    },
    {
        id: "tomorrow-night-eighties",
        name: "Tomorrow Night Eighties",
        kind: "dark",
        background: "#2d2d2d",
        load: () => import("monaco-themes-json/Tomorrow-Night-Eighties.json"),
    },
    {
        id: "twilight",
        name: "Twilight",
        kind: "dark",
        background: "#141414",
        load: () => import("monaco-themes-json/Twilight.json"),
    },
    // monaco-themes, light
    {
        id: "clouds",
        name: "Clouds",
        kind: "light",
        background: "#ffffff",
        load: () => import("monaco-themes-json/Clouds.json"),
    },
    {
        id: "dawn",
        name: "Dawn",
        kind: "light",
        background: "#f9f9f9",
        load: () => import("monaco-themes-json/Dawn.json"),
    },
    {
        id: "github-light",
        name: "GitHub Light",
        kind: "light",
        background: "#ffffff",
        load: () => import("monaco-themes-json/GitHub Light.json"),
    },
    {
        id: "idle",
        name: "IDLE",
        kind: "light",
        background: "#ffffff",
        load: () => import("monaco-themes-json/IDLE.json"),
    },
    {
        id: "solarized-light",
        name: "Solarized Light",
        kind: "light",
        background: "#fdf6e3",
        load: () => import("monaco-themes-json/Solarized-light.json"),
    },
    {
        id: "tomorrow",
        name: "Tomorrow",
        kind: "light",
        background: "#ffffff",
        load: () => import("monaco-themes-json/Tomorrow.json"),
    },
    {
        id: "xcode",
        name: "Xcode",
        kind: "light",
        background: "#ffffff",
        load: () => import("monaco-themes-json/Xcode_default.json"),
    },
];

/** The theme with this ID, or the default (e.g. for a removed theme). */
export function findTheme(id: string): EditorTheme {
    return (
        EDITOR_THEMES.find((t) => t.id === id) ??
        EDITOR_THEMES.find((t) => t.id === DEFAULT_THEME_ID)!
    );
}

/**
 * Token names Monaco's highlighters use, and the TextMate scopes (what
 * monaco-themes' rules are written for) to borrow their colors from, first
 * match wins. Without these, numbers and type names stay uncolored, since
 * no TextMate rule is named `number` or `type`.
 */
const MONARCH_FALLBACKS: Record<string, readonly string[]> = {
    number: ["constant.numeric"],
    type: [
        "storage.type",
        "support.type",
        "entity.name.type",
        "entity.name.class",
    ],
    typename: [
        "storage.type",
        "support.type",
        "entity.name.type",
        "entity.name.class",
    ],
    annotation: [
        "storage.type.annotation",
        "meta.declaration.annotation",
        "storage",
    ],
};

/** Adds rules for Monaco's token names that the theme doesn't cover. */
export function adaptTheme(theme: EditorThemeData): EditorThemeData {
    const byToken = new Map(theme.rules.map((r) => [r.token, r]));
    const extra: editor.ITokenThemeRule[] = [];
    for (const [token, scopes] of Object.entries(MONARCH_FALLBACKS)) {
        if (byToken.has(token)) continue;
        const source = scopes
            .map((s) => byToken.get(s))
            .find((r) => r?.foreground);
        if (source) extra.push({ ...source, token });
    }
    return { ...theme, rules: [...theme.rules, ...extra] };
}

const cache = new Map<string, Promise<EditorThemeData>>();

/** The theme's data; undefined for Monaco's built-ins, which need none. */
export function loadThemeData(
    theme: EditorTheme,
): Promise<EditorThemeData> | undefined {
    const { load } = theme;
    if (!load) return undefined;
    let data = cache.get(theme.id);
    if (!data) {
        data = load()
            .then((m) => adaptTheme(m.default as EditorThemeData))
            .catch((error: unknown) => {
                // Let the next attempt retry, e.g. after a network blip.
                cache.delete(theme.id);
                throw error;
            });
        cache.set(theme.id, data);
    }
    return data;
}
