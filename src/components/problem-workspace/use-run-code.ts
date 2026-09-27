import { toast } from "sonner";
import { api } from "~/trpc/react";
import { formatJudge0Errors } from "~/lib/problems/execute/judge0-result";
import type { CodeEditorState } from "./use-code-editor";
import type { TestIOState } from "./use-test-io";

/** Runs the editor's code against the test input and shows the result. */
export function useRunCode(codeEditor: CodeEditorState, io: TestIOState) {
    const mutation = api.execute.runCode.useMutation({
        onSuccess: (data) => {
            io.showOutput({
                stdout: data.stdout,
                stderr: formatJudge0Errors(data),
            });
            toast("Program has finished running.");
        },
        onError: () => {
            io.showFailure("Program failed to run.");
            toast("Program failed to run.");
        },
    });

    function run() {
        const code = codeEditor.getCode();
        if (code === null) return;
        toast("Starting code execution...");
        mutation.mutate({
            code,
            input: io.input,
            languageId: codeEditor.language.id,
        });
    }

    return { run, isRunning: mutation.isPending };
}
