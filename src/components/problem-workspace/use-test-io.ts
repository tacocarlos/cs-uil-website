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

    /** Show a program's output, focusing the error tab if there is any. */
    function showOutput(output: {
        stdout?: string | null;
        stderr?: string | null;
    }) {
        setStdout(output.stdout ?? "");
        setStderr(output.stderr ?? "");
        setTab(output.stderr ? "stderr" : "stdout");
    }

    function showFailure(message: string) {
        setStdout(message);
        setStderr(message);
        setTab("stderr");
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
    };
}

export type TestIOState = ReturnType<typeof useTestIO>;
