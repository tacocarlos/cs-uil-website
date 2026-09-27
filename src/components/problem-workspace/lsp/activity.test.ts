import { describe, expect, test } from "bun:test";
import { onNextActivity } from "./activity";

/** Fake editor that records listeners and lets the test fire events. */
function fakeEditor() {
    const listeners = {
        change: new Set<() => void>(),
        focus: new Set<() => void>(),
    };
    const add = (set: Set<() => void>) => (listener: () => void) => {
        set.add(listener);
        return { dispose: () => set.delete(listener) };
    };
    return {
        editor: {
            onDidChangeModelContent: add(listeners.change),
            onDidFocusEditorText: add(listeners.focus),
        },
        type: () => [...listeners.change].forEach((l) => l()),
        focus: () => [...listeners.focus].forEach((l) => l()),
        listenerCount: () => listeners.change.size + listeners.focus.size,
    };
}

describe("onNextActivity", () => {
    test("fires once on typing, then stops listening", () => {
        const fake = fakeEditor();
        let calls = 0;
        onNextActivity(fake.editor, () => calls++);

        fake.type();
        fake.type();
        fake.focus();

        expect(calls).toBe(1);
        expect(fake.listenerCount()).toBe(0);
    });

    test("fires on focusing the editor", () => {
        const fake = fakeEditor();
        let calls = 0;
        onNextActivity(fake.editor, () => calls++);

        fake.focus();

        expect(calls).toBe(1);
    });

    test("disposing cancels the wait", () => {
        const fake = fakeEditor();
        let calls = 0;
        onNextActivity(fake.editor, () => calls++).dispose();

        fake.type();

        expect(calls).toBe(0);
        expect(fake.listenerCount()).toBe(0);
    });
});
