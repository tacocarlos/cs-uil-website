"use client";

import { CodeEditor } from "~/components/problem-workspace/code-editor";
import {
    LanguageSelect,
    ResetCodeButton,
    RunButton,
} from "~/components/problem-workspace/editor-controls";
import { IOPanel } from "~/components/problem-workspace/io-panel";
import { EditorPane } from "~/components/problem-workspace/layout";
import { useCodeEditor } from "~/components/problem-workspace/use-code-editor";
import { useRunCode } from "~/components/problem-workspace/use-run-code";
import { useTestIO } from "~/components/problem-workspace/use-test-io";

const STORAGE_PREFIX = "sandbox";

/**
 * A scratch editor for quick experiments: one file, stdin in, stdout/stderr
 * out, in the languages that have code intelligence. Code and input are
 * saved in this browser only.
 */
export default function SandboxPage() {
    const codeEditor = useCodeEditor(STORAGE_PREFIX, { lspOnly: true });
    const io = useTestIO(STORAGE_PREFIX, "");
    const { run, isRunning } = useRunCode(codeEditor, io);

    return (
        <main className="bg-primary flex h-screen w-full flex-col pt-[10vh]">
            <EditorPane
                toolbar={
                    <>
                        <div className="flex items-center gap-3">
                            <h1 className="text-sm font-semibold text-slate-200">
                                Sandbox
                            </h1>
                            <span className="text-slate-600">|</span>
                            <LanguageSelect editor={codeEditor} />
                        </div>
                        <ResetCodeButton editor={codeEditor} />
                    </>
                }
                editor={<CodeEditor editor={codeEditor} />}
                io={
                    <IOPanel
                        io={io}
                        inputLabel="Input"
                        showResetInput={false}
                    />
                }
                footer={
                    <>
                        <RunButton onRun={run} isRunning={isRunning} />
                        <p className="text-xs text-slate-400">
                            Saved in this browser only
                        </p>
                    </>
                }
            />
        </main>
    );
}
