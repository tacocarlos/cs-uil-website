import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as ruff from "@astral-sh/ruff-wasm-web";
import { beforeAll, describe, expect, test } from "vitest";
import { createPythonFormatter, type PythonFormatter } from "./python-format";

const spaces = { tabSize: 4, insertSpaces: true };
let format: PythonFormatter;

beforeAll(() => {
    // The browser fetches the .wasm; here it's read from node_modules.
    const wasm = createRequire(import.meta.url).resolve(
        "@astral-sh/ruff-wasm-web/ruff_wasm_bg.wasm",
    );
    ruff.initSync({ module: readFileSync(wasm) });
    format = createPythonFormatter(ruff);
});

describe("createPythonFormatter", () => {
    test("formats Python code", () => {
        expect(format("def f( x ):\n  return x+1\nprint( f(1) )", spaces)).toBe(
            "def f(x):\n    return x + 1\n\n\nprint(f(1))\n",
        );
    });

    test("follows the editor's indentation settings", () => {
        const code = "if True:\n    x = 1\n";
        expect(format(code, { tabSize: 2, insertSpaces: true })).toBe(
            "if True:\n  x = 1\n",
        );
        expect(format(code, { tabSize: 4, insertSpaces: false })).toBe(
            "if True:\n\tx = 1\n",
        );
    });

    test("throws on a syntax error", () => {
        expect(() => format("def (:", spaces)).toThrow();
    });
});
