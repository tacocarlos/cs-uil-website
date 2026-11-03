import { toast } from "sonner";
import { api } from "~/trpc/react";
import { formatJudge0Errors } from "~/lib/problems/execute/judge0-result";
import type { CodeEditorState } from "./use-code-editor";
import type { TestIOState } from "./use-test-io";

/**
 * Runs the editor's code against the test input and shows the result.
 * Pass `problemId` on practice problems to mark them as started; leave it
 * out in the sandbox and contests.
 */
export function useRunCode(
    codeEditor: CodeEditorState,
    io: TestIOState,
    problemId?: number,
) {
    const utils = api.useUtils();
    const mutation = api.execute.runCode.useMutation({
        // The run is recorded even if it fails.
        onSettled: async () => {
            if (problemId !== undefined) {
                await utils.submission.getMyProblemProgress.invalidate();
            }
        },
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
            problemId,
        });
    }

    return { run, isRunning: mutation.isPending };
}
