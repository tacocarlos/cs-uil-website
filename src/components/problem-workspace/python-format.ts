/**
 * Python formatting in the browser with Ruff's WebAssembly build. pyright
 * (the Python language server) doesn't format, so unlike Java and C/C++
 * this doesn't go through the LSP gateway, and it works while the language
 * server is disconnected.
 *
 * Ruff (a few MB of WebAssembly) loads on the first format, not with the page.
 */
import type * as Ruff from "@astral-sh/ruff-wasm-web";
import type { Monaco } from "@monaco-editor/react";
import type { languages } from "monaco-editor";
import { toast } from "sonner";

type RuffModule = typeof Ruff;
type FormatOptions = { tabSize: number; insertSpaces: boolean };

/** Formats Python source; throws on a syntax error. */
export type PythonFormatter = (code: string, options: FormatOptions) => string;

/**
 * Wraps an initialized Ruff module. Formatted code targets Python 3.8,
 * the version Judge0 runs.
 */
export function createPythonFormatter(ruff: RuffModule): PythonFormatter {
    // A Workspace holds its settings, so keep one per indentation style.
    const workspaces = new Map<string, InstanceType<RuffModule["Workspace"]>>();
    return (code, { tabSize, insertSpaces }) => {
        const key = `${tabSize}:${insertSpaces}`;
        let workspace = workspaces.get(key);
        if (!workspace) {
            workspace = new ruff.Workspace(
                {
                    "target-version": "py38",
                    "indent-width": tabSize,
                    format: { "indent-style": insertSpaces ? "space" : "tab" },
                },
                ruff.PositionEncoding.Utf16,
            );
            workspaces.set(key, workspace);
        }
        return workspace.format(code);
    };
}

let formatterPromise: Promise<PythonFormatter> | undefined;

function loadFormatter(): Promise<PythonFormatter> {
    formatterPromise ??= import("@astral-sh/ruff-wasm-web")
        .then(async (ruff) => {
            await ruff.default();
            return createPythonFormatter(ruff);
        })
        .catch((error: unknown) => {
            // Let the next attempt retry, e.g. after a network blip.
            formatterPromise = undefined;
            throw error;
        });
    return formatterPromise;
}

const registered = new WeakSet<Monaco>();

/**
 * Registers "Format Document" (Shift+Alt+F) for Python. Providers are global
 * to the Monaco instance, so this runs once per instance however often the
 * editor remounts.
 */
export function registerPythonFormatter(monaco: Monaco): void {
    if (registered.has(monaco)) return;
    registered.add(monaco);
    monaco.languages.registerDocumentFormattingEditProvider("python", {
        async provideDocumentFormattingEdits(
            model,
            options,
        ): Promise<languages.TextEdit[]> {
            let format: PythonFormatter;
            try {
                format = await loadFormatter();
            } catch {
                toast("Couldn't load the Python formatter.");
                return [];
            }
            const code = model.getValue();
            let formatted: string;
            try {
                formatted = format(code, options);
            } catch {
                toast("Can't format: fix the syntax errors first.");
                return [];
            }
            // Text the user typed while Ruff loaded would be overwritten.
            if (model.isDisposed() || model.getValue() !== code) return [];
            if (formatted === code) return [];
            return [{ range: model.getFullModelRange(), text: formatted }];
        },
    });
}
