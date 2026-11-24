import { useState } from "react";
import { toast } from "sonner";
import { usePersistedState } from "./use-persisted-state";

export type IOTab = "input" | "stdout" | "stderr";

/** Test input (persisted), program output, and the active I/O tab. */
export function useTestIO(storagePrefix: string, defaultInput: string) {
    const [input, setInput] = usePersistedState(
        `${storagePrefix}-input`,
        defaultInput,
    );
    const [stdout, setStdout] = useState("");
    const [stderr, setStderr] = useState("");
    const [tab, setTab] = useState<IOTab>("input");
    // Bumped on every result, so the layout can reveal a hidden I/O panel.
    const [outputVersion, setOutputVersion] = useState(0);

    /** Show a program's output, focusing the error tab if there is any. */
    function showOutput(output: {
        stdout?: string | null;
        stderr?: string | null;
    }) {
        setStdout(output.stdout ?? "");
        setStderr(output.stderr ?? "");
        setTab(output.stderr ? "stderr" : "stdout");
        setOutputVersion((v) => v + 1);
    }

    function showFailure(message: string) {
        setStdout(message);
        setStderr(message);
        setTab("stderr");
        setOutputVersion((v) => v + 1);
    }

    function resetInput() {
        setInput(defaultInput);
        toast("Test input reset to default.");
    }

    return {
        input,
        setInput,
        resetInput,
        stdout,
        stderr,
        tab,
        setTab,
        showOutput,
        showFailure,
        outputVersion,
    };
}

export type TestIOState = ReturnType<typeof useTestIO>;
