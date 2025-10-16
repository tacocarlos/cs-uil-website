"use client";

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "~/components/ui/resizable";
import type { Problem } from "~/server/db/schema/types";
import { Editor, type Monaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useRef, useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { useSession } from "auth-client";
import ProblemStatement from "./components/problem-statement";
import PastSubmissions from "./components/past-submissions";

const starterCode = `import java.util.*;
import java.io.*;

public class Main {
public static void main(String[] args) throws IOException {
    Scanner sc = new Scanner(System.in);
    while(sc.hasNextLine()) {
        System.out.println(sc.nextLine());
    }
    sc.close();
}
}`;

export default function PageCore({ problem }: { problem: Problem }) {
    const { data: session } = useSession();

    // localStorage keys for this specific problem
    const codeStorageKey = `problem-${problem.id}-code`;
    const inputStorageKey = `problem-${problem.id}-input`;

    const editorRef = useRef<editor.IStandaloneCodeEditor>(null);
    function handleEditorDidMount(
        editor: editor.IStandaloneCodeEditor,
        monaco: Monaco,
    ) {
        editorRef.current = editor;

        // Load saved code from localStorage
        const savedCode = window.localStorage.getItem(codeStorageKey);
        if (savedCode) {
            editor.setValue(savedCode);
        }

        // Save code to localStorage on change
        editor.onDidChangeModelContent(() => {
            window.localStorage.setItem(codeStorageKey, editor.getValue());
        });
    }

    const [stdOut, setStdOut] = useState("");
    const [stdErr, setStdErr] = useState("");
    const [testInput, setTestInput] = useState(() => {
        // Load from localStorage on initial render
        if (typeof window !== "undefined") {
            const saved = window.localStorage.getItem(inputStorageKey);
            if (saved !== null) return saved;
        }
        return problem.defaultInputFile ?? "";
    });

    const [ioTab, setIOTab] = useState<"input" | "stderr" | "stdout">("input");

    // Save testInput to localStorage whenever it changes
    useEffect(() => {
        window.localStorage.setItem(inputStorageKey, testInput);
    }, [testInput, inputStorageKey]);

    const utils = api.useUtils();

    const runtimes = api.execute.getJavaRuntimes.useQuery().data;
    const javaRT = runtimes?.at(0) ?? { id: 62, name: "Java" };

    const pastSubmissions = api.submission.getProblemSubmissions.useQuery({
        problemId: problem.id,
        userId: session?.user.id ?? "",
    }).data;
    const solved = pastSubmissions?.at(0)?.accepted ?? false;

    const runCodeMutator = api.execute.runCode.useMutation({
        onSuccess: async (data) => {
            setStdOut(data.stdout ?? "");
            setStdErr(data.stderr ?? "");
            // Only switch tabs if we're currently on input tab
            if (ioTab === "input") {
                if (data.stdout) setIOTab("stdout");
                else if (data.stderr) setIOTab("stderr");
            }
            toast("Program Has Finished Running");
        },
        onError: async (data) => {
            setStdOut("Problem Has Failed To Run");
            setStdErr("Problem Has Failed To Run");
            // Only switch to stderr if we're currently on input tab
            if (ioTab === "input") {
                setIOTab("stderr");
            }
            toast("Program Has Failed To Run");
        },
    });

    const submitCodeMutator = api.execute.submitCode.useMutation({
        onSuccess: async (data) => {
            utils.submission.invalidate();
            console.dir(data);
            toast(
                `Submitted Code - ${data.accepted ? "Solution Accepted" : "Solution Denied"}`,
            );
        },
    });

    async function runCode() {
        toast("Starting code execution...");
        if (!editorRef.current) {
            toast("Editor is not initialized.");
            return;
        }

        const code = editorRef.current.getValue();
        await runCodeMutator.mutateAsync({
            code,
            input: testInput,
            languageId: javaRT.id.toString(),
        });
    }

    async function submitCode() {
        toast("Starting code execution...");
        if (!editorRef.current) {
            toast("Editor is not initialized.");
            return;
        }

        const code = editorRef.current.getValue();
        submitCodeMutator.mutate({
            problemId: problem.id,
            userID: session!.user.id,
            code: code,
            languageId: javaRT.id.toString(),
        });
    }

    function resetTestInput() {
        setTestInput(problem.defaultInputFile ?? "");
        toast("Test input reset to default");
    }

    function resetCode() {
        const editor = editorRef.current;
        if (editor === null) return;
        editor.setValue(starterCode);
    }

    if (session === null) {
        return <></>;
    }

    return (
        <div className="bg-primary flex h-screen w-full flex-col pt-[10vh]">
            <ResizablePanelGroup
                direction="horizontal"
                className="h-full w-full"
            >
                {/* Left Panel - Problem Description */}
                <ResizablePanel defaultSize={40} minSize={30}>
                    <div className="flex h-full flex-col bg-white">
                        <Tabs
                            defaultValue="problem-statement"
                            className="flex h-full flex-col"
                        >
                            <TabsList className="w-full justify-start rounded-none border-b bg-white px-4">
                                <TabsTrigger
                                    value="problem-statement"
                                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
                                >
                                    Description
                                </TabsTrigger>
                                <TabsTrigger
                                    value="past-submissions"
                                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
                                >
                                    Submissions
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent
                                value="problem-statement"
                                className="prose prose-slate mt-0 max-w-none flex-1 overflow-y-auto p-6"
                            >
                                <ProblemStatement problem={problem} />
                            </TabsContent>
                            <TabsContent
                                value="past-submissions"
                                className="mt-0 flex-1 overflow-y-auto p-6"
                            >
                                <PastSubmissions
                                    submissions={pastSubmissions ?? []}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </ResizablePanel>

                <ResizableHandle className="w-1 bg-slate-300 hover:bg-slate-400" />

                {/* Right Panel - Code Editor */}
                <ResizablePanel defaultSize={60} minSize={40}>
                    <div className="flex h-full flex-col bg-slate-900">
                        {/* Editor Header */}
                        <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-4 py-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-300">
                                    Java
                                </span>
                            </div>
                            <div>
                                <Button
                                    className="text-sm font-medium text-slate-300"
                                    onClick={() => {
                                        const decision = confirm(
                                            "This action will reset your code editor, and ALL PROGRESS WILL BE LOST. Are you sure?",
                                        );

                                        if (decision === false) return;
                                        resetCode();
                                    }}
                                >
                                    Reset To Default Code
                                </Button>
                            </div>
                        </div>

                        <ResizablePanelGroup direction="vertical">
                            {/* Code Editor */}
                            <ResizablePanel defaultSize={70} minSize={30}>
                                <Editor
                                    theme="vs-dark"
                                    defaultLanguage="java"
                                    height="100%"
                                    language="java"
                                    options={{
                                        automaticLayout: true,
                                        fontSize: 14,
                                        minimap: { enabled: false },
                                        scrollBeyondLastLine: false,
                                        fontFamily:
                                            "'Fira Code', 'Consolas', 'Courier New', monospace",
                                        padding: { top: 16, bottom: 16 },
                                        lineHeight: 1.6,
                                    }}
                                    onMount={handleEditorDidMount}
                                    defaultValue={starterCode}
                                />
                            </ResizablePanel>

                            <ResizableHandle className="h-1 bg-slate-700 hover:bg-slate-600" />

                            {/* Test Cases / Output Panel */}
                            <ResizablePanel defaultSize={30} minSize={20}>
                                <div className="flex h-full flex-col bg-slate-900">
                                    <Tabs
                                        defaultValue={ioTab}
                                        value={ioTab}
                                        className="flex h-full flex-col overflow-y-auto"
                                    >
                                        <div className="flex w-full items-center justify-between border-b border-slate-700 bg-slate-800 px-4">
                                            <TabsList className="justify-start border-none bg-transparent">
                                                <TabsTrigger
                                                    value="input"
                                                    onClick={() =>
                                                        setIOTab("input")
                                                    }
                                                    className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                                                >
                                                    Testcase
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="stdout"
                                                    onClick={() =>
                                                        setIOTab("stdout")
                                                    }
                                                    className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                                                >
                                                    Output
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="stderr"
                                                    onClick={() =>
                                                        setIOTab("stderr")
                                                    }
                                                    className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                                                >
                                                    Errors
                                                </TabsTrigger>
                                            </TabsList>
                                            {ioTab === "input" && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 text-xs text-slate-300 hover:bg-slate-700 hover:text-white"
                                                        >
                                                            Reset to Default
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>
                                                                Reset test
                                                                input?
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will reset
                                                                the test input
                                                                to the default
                                                                value. Any
                                                                custom input you
                                                                {"'"}ve entered
                                                                will be lost.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>
                                                                Cancel
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={
                                                                    resetTestInput
                                                                }
                                                            >
                                                                Reset
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </div>
                                        <TabsContent
                                            value="input"
                                            className="h-full flex-1 p-4"
                                        >
                                            <Textarea
                                                className="h-full w-full resize-none border-slate-700 bg-slate-800 font-mono text-sm text-slate-100"
                                                value={testInput}
                                                onChange={(e) =>
                                                    setTestInput(e.target.value)
                                                }
                                                placeholder="Enter test input..."
                                            />
                                        </TabsContent>
                                        <TabsContent
                                            value="stdout"
                                            className="h-full flex-1 p-4"
                                        >
                                            <Textarea
                                                className="h-full w-full resize-none border-slate-700 bg-slate-800 font-mono text-sm text-slate-100"
                                                value={stdOut}
                                                readOnly
                                                placeholder="Run code to see output..."
                                            />
                                        </TabsContent>
                                        <TabsContent
                                            value="stderr"
                                            className="h-full flex-1 p-4"
                                        >
                                            <Textarea
                                                className="h-full w-full resize-none border-slate-700 bg-slate-800 font-mono text-sm text-red-400"
                                                value={stdErr}
                                                readOnly
                                                placeholder="Errors will appear here..."
                                            />
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>

                        {/* Action Buttons Footer */}
                        <div className="flex items-center justify-between border-t border-slate-700 bg-slate-800 px-4 py-3">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={runCode}
                                    disabled={runCodeMutator.isPending}
                                    className="border-slate-600 bg-slate-700 text-white hover:bg-slate-600"
                                >
                                    {runCodeMutator.isPending
                                        ? "Running..."
                                        : "Run"}
                                </Button>
                            </div>
                            <Button
                                onClick={submitCode}
                                disabled={solved || submitCodeMutator.isPending}
                                className="bg-green-600 text-white hover:bg-green-700 disabled:bg-slate-600"
                            >
                                {submitCodeMutator.isPending
                                    ? "Submitting..."
                                    : solved
                                      ? "Solved"
                                      : "Submit"}
                            </Button>
                        </div>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
