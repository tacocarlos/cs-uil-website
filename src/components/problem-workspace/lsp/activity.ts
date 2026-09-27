import type { IDisposable } from "monaco-editor";

/** The parts of a Monaco editor needed to notice the user coming back. */
type EditorEvents = {
    onDidChangeModelContent(listener: () => void): IDisposable;
    onDidFocusEditorText(listener: () => void): IDisposable;
};

/**
 * Calls `callback` once, the next time the user types in or clicks into the
 * editor. Dispose to stop waiting.
 */
export function onNextActivity(
    editor: EditorEvents,
    callback: () => void,
): IDisposable {
    let fired = false;
    const listeners = [
        editor.onDidChangeModelContent(fire),
        editor.onDidFocusEditorText(fire),
    ];

    function fire() {
        if (fired) return;
        fired = true;
        dispose();
        callback();
    }

    function dispose() {
        for (const l of listeners) l.dispose();
    }

    return { dispose };
}
