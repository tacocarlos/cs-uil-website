"use client";

import { toast } from "sonner";
import { useSession } from "auth-client";
import { api } from "~/trpc/react";
import type { Problem } from "~/server/db/schema/types";
import { CodeEditor } from "~/components/problem-workspace/code-editor";
import {
    LanguageSelect,
    ResetCodeButton,
    RunButton,
    SubmitButton,
} from "~/components/problem-workspace/editor-controls";
import { IOPanel } from "~/components/problem-workspace/io-panel";
import {
    EditorPane,
    ProblemSidebar,
    ProblemWorkspace,
} from "~/components/problem-workspace/layout";
import ProblemStatement from "~/components/problem-workspace/problem-statement";
import { useCodeEditor } from "~/components/problem-workspace/use-code-editor";
import { useRunCode } from "~/components/problem-workspace/use-run-code";
import { useTestIO } from "~/components/problem-workspace/use-test-io";
import PastSubmissions from "./components/past-submissions";

export default function PageCore({ problem }: { problem: Problem }) {
    const { data: session } = useSession();

    const storagePrefix = `problem-${problem.id}`;
    const codeEditor = useCodeEditor(storagePrefix);
    const io = useTestIO(storagePrefix, problem.defaultInputFile ?? "");
    const { run, isRunning } = useRunCode(codeEditor, io);

    const utils = api.useUtils();

    const { data: pastSubmissions } =
        api.submission.getProblemSubmissions.useQuery({
            problemId: problem.id,
        });
    const solved = pastSubmissions?.at(0)?.accepted ?? false;

    const submitMutation = api.execute.submitCode.useMutation({
        onSuccess: async (data) => {
            await utils.submission.invalidate();
            toast(
                `Submitted Code - ${data.accepted ? "Solution Accepted" : "Solution Denied"}`,
            );
        },
    });

    function submit() {
        const code = codeEditor.getCode();
        if (code === null || !session) return;
        toast("Submitting solution...");
        submitMutation.mutate({
            problemId: problem.id,
            code,
            languageId: codeEditor.language.id,
        });
    }

    if (session === null) return null;

    return (
        <div className="bg-primary flex h-screen w-full flex-col pt-[10vh]">
            <ProblemWorkspace
                sidebar={
                    <ProblemSidebar
                        tabs={[
                            {
                                value: "problem-statement",
                                label: "Description",
                                className: "prose prose-slate max-w-none",
                                content: <ProblemStatement problem={problem} />,
                            },
                            {
                                value: "past-submissions",
                                label: "Submissions",
                                content: (
                                    <PastSubmissions
                                        submissions={pastSubmissions ?? []}
                                    />
                                ),
                            },
                        ]}
                    />
                }
            >
                <EditorPane
                    toolbar={
                        <>
                            <LanguageSelect editor={codeEditor} />
                            <ResetCodeButton editor={codeEditor} />
                        </>
                    }
                    editor={<CodeEditor editor={codeEditor} />}
                    io={<IOPanel io={io} />}
                    footer={
                        <>
                            <RunButton onRun={run} isRunning={isRunning} />
                            <SubmitButton
                                onSubmit={submit}
                                isSubmitting={submitMutation.isPending}
                                disabledReason={solved ? "Solved" : undefined}
                            />
                        </>
                    }
                />
            </ProblemWorkspace>
        </div>
    );
}
