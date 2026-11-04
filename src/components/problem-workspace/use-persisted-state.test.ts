import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
    useHydrated,
    usePersistedState,
    usePersistedStateJSON,
} from "./use-persisted-state";

/** A browser-like window whose localStorage holds `saved`. */
function stubStorage(saved: Record<string, string>) {
    vi.stubGlobal("window", {
        localStorage: {
            getItem: (key: string) => saved[key] ?? null,
            setItem: (key: string, value: string) => {
                saved[key] = value;
            },
        },
    });
}

afterEach(() => {
    vi.unstubAllGlobals();
});

// React renders the server snapshot both on the server and while hydrating,
// so this is also what the browser's first render shows. If it showed the
// saved value instead, it wouldn't match the server's HTML.
describe("first render (server and hydration)", () => {
    test("shows the fallback even when a value is saved", () => {
        stubStorage({
            language: "python",
            options: JSON.stringify({ fontSize: 20 }),
        });
        function Probe() {
            const [language] = usePersistedState("language", "java");
            const [options] = usePersistedStateJSON("options", {
                fontSize: 14,
            });
            const hydrated = useHydrated();
            return `${language} ${options.fontSize} ${hydrated}`;
        }
        expect(renderToString(createElement(Probe))).toBe("java 14 false");
    });
});
