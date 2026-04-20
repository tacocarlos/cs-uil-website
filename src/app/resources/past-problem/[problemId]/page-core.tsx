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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { useSession } from "auth-client";
import ProblemStatement from "./components/problem-statement";
import PastSubmissions from "./components/past-submissions";

// ─────────────────────────────────────────────────────────────────────────────
// Language definitions
// ─────────────────────────────────────────────────────────────────────────────

type LanguageConfig = {
    /** Judge0 language ID */
    id: string;
    /** Display name shown in the selector */
    name: string;
    /** Monaco editor language identifier */
    monacoLang: string;
    /** Starter code that echoes stdin */
    starterCode: string;
};

const LANGUAGES: LanguageConfig[] = [
    {
        id: "62",
        name: "Java",
        monacoLang: "java",
        starterCode: `import java.util.*;
import java.io.*;

public class Main {
public static void main(String[] args) throws IOException {
    Scanner sc = new Scanner(System.in);
    while (sc.hasNextLine()) {
        System.out.println(sc.nextLine());
    }
    sc.close();
}
}`,
    },
    {
        id: "50",
        name: "C",
        monacoLang: "c",
        starterCode: `#include <stdio.h>

int main() {
    char line[1024];
    while (fgets(line, sizeof(line), stdin)) {
        printf("%s", line);
    }
    return 0;
}`,
    },
    {
        id: "54",
        name: "C++",
        monacoLang: "cpp",
        starterCode: `#include <iostream>
#include <string>

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        std::cout << line << "\\n";
    }
    return 0;
}`,
    },
    {
        id: "71",
        name: "Python",
        monacoLang: "python",
        starterCode: `import sys

for line in sys.stdin:
    print(line, end="")`,
    },
];

const DEFAULT_LANGUAGE_ID = "62";

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function PageCore({ problem }: { problem: Problem }) {
    const { data: session } = useSession();

    // localStorage keys for this specific problem
    const inputStorageKey = `problem-${problem.id}-input`;
    const langStorageKey = `problem-${problem.id}-language`;

    // Per-language code key so each language's editor content is stored independently
    const codeKeyForLang = (langId: string) =>
        `problem-${problem.id}-code-${langId}`;

    // ── Language selection ──────────────────────────────────────────────────

    const [selectedLanguageId, setSelectedLanguageId] = useState<string>(() => {
        if (typeof window !== "undefined") {
            return (
                window.localStorage.getItem(langStorageKey) ??
                DEFAULT_LANGUAGE_ID
            );
        }
        return DEFAULT_LANGUAGE_ID;
    });

    const selectedLanguage =
        LANGUAGES.find((l) => l.id === selectedLanguageId) ?? LANGUAGES[0]!;

    // Ref kept in sync with state so the onDidChangeModelContent listener (registered
    // once on mount) always writes to the current language's key without going stale.
    const selectedLanguageIdRef = useRef(selectedLanguageId);
    useEffect(() => {
        selectedLanguageIdRef.current = selectedLanguageId;
    }, [selectedLanguageId]);

    function handleLanguageChange(newLangId: string) {
        const ed = editorRef.current;
        if (ed) {
            // Flush current code to the outgoing language's key.
            window.localStorage.setItem(
                codeKeyForLang(selectedLanguageId),
                ed.getValue(),
            );

            // Advance the ref BEFORE calling setValue so that the synchronous
            // onDidChangeModelContent callback saves to the correct (new) key.
            selectedLanguageIdRef.current = newLangId;

            // Restore saved code for the incoming language, or show its starter code.
            const newLang =
                LANGUAGES.find((l) => l.id === newLangId) ?? LANGUAGES[0]!;
            const saved = window.localStorage.getItem(
                codeKeyForLang(newLangId),
            );
            ed.setValue(saved ?? newLang.starterCode);
        }

        setSelectedLanguageId(newLangId);
        window.localStorage.setItem(langStorageKey, newLangId);
    }

    // ── Editor ref & mount ──────────────────────────────────────────────────

    const editorRef = useRef<editor.IStandaloneCodeEditor>(null);

    function handleEditorDidMount(
        editorInstance: editor.IStandaloneCodeEditor,
        _monaco: Monaco,
    ) {
        // Restore saved code for the initially selected language, falling back
        // to that language's starter code on a first visit.
        const savedCode = window.localStorage.getItem(
            codeKeyForLang(selectedLanguageId),
        );
        editorInstance.setValue(savedCode ?? selectedLanguage.starterCode);

        // Persist code on every change. Uses the ref so this single listener,
        // registered once, always writes to whichever language is active.
        editorInstance.onDidChangeModelContent(() => {
            window.localStorage.setItem(
                codeKeyForLang(selectedLanguageIdRef.current),
                editorInstance.getValue(),
            );
        });

        toast("Editor initialized.");
        editorRef.current = editorInstance;
    }

    // ── I/O state ───────────────────────────────────────────────────────────

    const [stdOut, setStdOut] = useState("");
    const [stdErr, setStdErr] = useState("");
    const [testInput, setTestInput] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = window.localStorage.getItem(inputStorageKey);
            if (saved !== null) return saved;
        }
        return problem.defaultInputFile ?? "";
    });
    const [ioTab, setIOTab] = useState<"input" | "stderr" | "stdout">("input");

    // Persist test input to localStorage whenever it changes
    useEffect(() => {
        window.localStorage.setItem(inputStorageKey, testInput);
    }, [testInput, inputStorageKey]);

    // ── tRPC ────────────────────────────────────────────────────────────────

    const utils = api.useUtils();

    const pastSubmissions = api.submission.getProblemSubmissions.useQuery({
        problemId: problem.id,
        userId: session?.user.id ?? "",
    }).data;
    const solved = pastSubmissions?.at(0)?.accepted ?? false;

    const runCodeMutator = api.execute.runCode.useMutation({
        onSuccess: async (data) => {
            setStdOut(data.stdout ?? "");
            setIOTab("stdout");
            if (data.compile_output !== null) {
                setStdErr(data.compile_output);
                setIOTab("stderr");
            } else {
                setStdErr(data.stderr ?? "");
                setIOTab("stderr");
            }
            toast("Program Has Finished Running");
        },
        onError: async () => {
            setStdOut("Problem Has Failed To Run");
            setStdErr("Problem Has Failed To Run");
            if (ioTab === "input" || ioTab === "stdout") {
                setIOTab("stderr");
            }
            toast("Program Has Failed To Run");
        },
    });

    const submitCodeMutator = api.execute.submitCode.useMutation({
        onSuccess: async (data) => {
            await utils.submission.invalidate();
            console.dir(data);
            toast(
                `Submitted Code - ${data.accepted ? "Solution Accepted" : "Solution Denied"}`,
            );
        },
    });

    // ── Actions ─────────────────────────────────────────────────────────────

    async function runCode() {
        toast("Starting code execution...");
        if (editorRef.current === null) {
            toast("Editor is not initialized.");
            return;
        }
        const code = editorRef.current.getValue();
        await runCodeMutator.mutateAsync({
            code,
            input: testInput,
            languageId: selectedLanguageId,
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
            code,
            languageId: selectedLanguageId,
        });
    }

    function resetTestInput() {
        setTestInput(problem.defaultInputFile ?? "");
        toast("Test input reset to default");
    }

    function resetCode() {
        const ed = editorRef.current;
        if (ed === null) return;
        ed.setValue(selectedLanguage.starterCode);
    }

    if (session === null) {
        return <></>;
    }

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="bg-primary flex h-screen w-full flex-col pt-[10vh]">
            <ResizablePanelGroup
                direction="horizontal"
                className="h-full w-full"
            >
                {/* ── Left Panel – Problem Description ── */}
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

                {/* ── Right Panel – Code Editor ── */}
                <ResizablePanel defaultSize={60} minSize={40}>
                    <div className="flex h-full flex-col bg-slate-900">
                        {/* Editor Header */}
                        <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-4 py-2">
                            {/* Language selector */}
                            <Select
                                value={selectedLanguageId}
                                onValueChange={handleLanguageChange}
                            >
                                <SelectTrigger className="w-32 border-slate-600 bg-slate-700 text-sm text-slate-300 focus:ring-0 focus:ring-offset-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {LANGUAGES.map((lang) => (
                                        <SelectItem
                                            key={lang.id}
                                            value={lang.id}
                                        >
                                            {lang.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Reset button */}
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

                        <ResizablePanelGroup direction="vertical">
                            {/* Code Editor */}
                            <ResizablePanel defaultSize={70} minSize={30}>
                                <Editor
                                    theme="vs-dark"
                                    height="100%"
                                    language={selectedLanguage.monacoLang}
                                    defaultValue={selectedLanguage.starterCode}
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
                                />
                            </ResizablePanel>

                            <ResizableHandle className="h-1 bg-slate-700 hover:bg-slate-600" />

                            {/* Test Cases / Output Panel */}
                            <ResizablePanel defaultSize={30} minSize={20}>
                                <div className="flex h-full flex-col bg-slate-900">
                                    <Tabs
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
