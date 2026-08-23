"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeMathjax from "rehype-mathjax";
import { Editor, type Monaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "~/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
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
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import type { Problem } from "~/server/db/schema/types";

// ─────────────────────────────────────────────────────────────────────────────
// Language definitions
// ─────────────────────────────────────────────────────────────────────────────

type LanguageConfig = {
    id: string;
    name: string;
    monacoLang: string;
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
// Props
// ─────────────────────────────────────────────────────────────────────────────

type ContestStatus = "draft" | "scheduled" | "active" | "frozen" | "ended";

interface ContestEditorProps {
    problem: Problem;
    contestProblem: {
        id: number;
        contestId: number;
        apiProblemId: number;
        label: string;
        maxPoints: number;
    };
    contestStatus: ContestStatus;
    userId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function ContestEditor({
    problem,
    contestProblem,
    contestStatus,
    userId,
}: ContestEditorProps) {
    const { contestId, apiProblemId, maxPoints } = contestProblem;

    // ── localStorage keys ───────────────────────────────────────────────────

    const inputStorageKey = `contest-${contestId}-problem-${apiProblemId}-input`;
    const langStorageKey = `contest-${contestId}-problem-${apiProblemId}-language`;
    const codeKeyForLang = (langId: string) =>
        `contest-${contestId}-problem-${apiProblemId}-code-${langId}`;

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

    const selectedLanguageIdRef = useRef(selectedLanguageId);
    useEffect(() => {
        selectedLanguageIdRef.current = selectedLanguageId;
    }, [selectedLanguageId]);

    function handleLanguageChange(newLangId: string) {
        const ed = editorRef.current;
        if (ed) {
            window.localStorage.setItem(
                codeKeyForLang(selectedLanguageId),
                ed.getValue(),
            );
            selectedLanguageIdRef.current = newLangId;
            const newLang =
                LANGUAGES.find((l) => l.id === newLangId) ?? LANGUAGES[0]!;
            const saved = window.localStorage.getItem(codeKeyForLang(newLangId));
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
        const savedCode = window.localStorage.getItem(
            codeKeyForLang(selectedLanguageId),
        );
        editorInstance.setValue(savedCode ?? selectedLanguage.starterCode);

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

    useEffect(() => {
        window.localStorage.setItem(inputStorageKey, testInput);
    }, [testInput, inputStorageKey]);

    // ── tRPC ────────────────────────────────────────────────────────────────

    const utils = api.useUtils();

    const { data: bestPerProblem } = api.contest.getMyBestPerProblem.useQuery({
        contestId,
        userId,
    });

    const myBest = bestPerProblem?.find(
        (b) => b.apiProblemId === apiProblemId,
    );

    const runCodeMutator = api.execute.runCode.useMutation({
        onSuccess: (data) => {
            setStdOut(data.stdout ?? "");
            setIOTab("stdout");
            if (data.compile_output !== null) {
                setStdErr(data.compile_output);
                setIOTab("stderr");
            } else {
                setStdErr(data.stderr ?? "");
                if (data.stderr) setIOTab("stderr");
            }
            toast("Program has finished running.");
        },
        onError: () => {
            setStdOut("Program failed to run.");
            setStdErr("Program failed to run.");
            if (ioTab === "input" || ioTab === "stdout") setIOTab("stderr");
            toast("Program failed to run.");
        },
    });

    const submitCodeMutator = api.contest.submitCode.useMutation({
        onSuccess: async (data) => {
            await utils.contest.getMyBestPerProblem.invalidate({
                contestId,
                userId,
            });
            // Mirror run output so the user can see what happened.
            setStdOut(data.stdout ?? "");
            setStdErr(data.stderr ?? data.compileOutput ?? "");
            setIOTab(data.stdout ? "stdout" : "stderr");
            toast(
                data.accepted
                    ? `✓ Accepted — ${data.points} / ${maxPoints} pts`
                    : `✗ Denied — attempt #${data.attemptNumber}`,
            );
        },
        onError: (err) => {
            toast(`Submission failed: ${err.message}`);
        },
    });

    // ── Actions ─────────────────────────────────────────────────────────────

    async function runCode() {
        if (!editorRef.current) {
            toast("Editor is not initialized.");
            return;
        }
        toast("Starting code execution...");
        await runCodeMutator.mutateAsync({
            code: editorRef.current.getValue(),
            input: testInput,
            languageId: selectedLanguageId,
        });
    }

    function submitCode() {
        if (!editorRef.current) {
            toast("Editor is not initialized.");
            return;
        }
        toast("Submitting solution...");
        submitCodeMutator.mutate({
            contestId,
            apiProblemId,
            userId,
            code: editorRef.current.getValue(),
            languageId: selectedLanguageId,
        });
    }

    function resetTestInput() {
        setTestInput(problem.defaultInputFile ?? "");
        toast("Test input reset to default.");
    }

    function resetCode() {
        const ed = editorRef.current;
        if (!ed) return;
        ed.setValue(selectedLanguage.starterCode);
    }

    // ── Derived UI state ────────────────────────────────────────────────────

    const canSubmit = contestStatus === "active" && !submitCodeMutator.isPending;

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
            {/* ── Left Panel – Problem Description + Contest Submissions ── */}
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
                                value="submissions"
                                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
                            >
                                Submissions
                            </TabsTrigger>
                        </TabsList>

                        {/* ── Description tab ── */}
                        <TabsContent
                            value="problem-statement"
                            className="prose prose-slate mt-0 max-w-none flex-1 overflow-y-auto p-6"
                        >
                            <Markdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeMathjax]}
                            >
                                {`## ${problem.problemName}
${problem.problemText}

---

## Example Input
\`\`\`
${problem.defaultInputFile !== "" && problem.defaultInputFile !== null ? problem.defaultInputFile : "No Input Given For This Problem"}
\`\`\`

---

## Example Output
\`\`\`
${problem.sampleOutput}
\`\`\`
`}
                            </Markdown>
                        </TabsContent>

                        {/* ── Submissions tab ── */}
                        <TabsContent
                            value="submissions"
                            className="mt-0 flex-1 overflow-y-auto p-6"
                        >
                            <h3 className="mb-4 text-base font-semibold text-slate-700">
                                My Contest Progress
                            </h3>
                            {!myBest ? (
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <XCircle className="h-4 w-4 text-slate-400" />
                                    No submissions yet.
                                </div>
                            ) : myBest.accepted ? (
                                <div className="rounded-md border border-green-200 bg-green-50 p-4">
                                    <div className="flex items-center gap-2 text-green-700">
                                        <CheckCircle2 className="h-5 w-5" />
                                        <span className="font-semibold">
                                            Accepted
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm text-green-600">
                                        Score:{" "}
                                        <span className="font-semibold">
                                            {myBest.points} / {maxPoints} pts
                                        </span>
                                    </p>
                                    <p className="text-sm text-green-600">
                                        Accepted on attempt #
                                        {myBest.attemptNumber}
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-md border border-red-200 bg-red-50 p-4">
                                    <div className="flex items-center gap-2 text-red-700">
                                        <XCircle className="h-5 w-5" />
                                        <span className="font-semibold">
                                            Not yet accepted
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm text-red-600">
                                        {myBest.attemptNumber}{" "}
                                        {myBest.attemptNumber === 1
                                            ? "attempt"
                                            : "attempts"}{" "}
                                        so far
                                    </p>
                                </div>
                            )}
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
                        <div className="flex items-center gap-3">
                            {/* Back link */}
                            <Link
                                href={`/contest/${contestId}`}
                                className="flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-slate-200"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to contest
                            </Link>

                            {/* Divider */}
                            <span className="text-slate-600">|</span>

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
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Accepted badge */}
                            {myBest?.accepted && (
                                <Badge className="bg-green-600 text-white hover:bg-green-600">
                                    Accepted — {myBest.points} / {maxPoints} pts
                                </Badge>
                            )}

                            {/* Contest status indicator */}
                            {contestStatus !== "active" && (
                                <Badge
                                    variant="outline"
                                    className="border-amber-500 text-amber-400"
                                >
                                    Contest {contestStatus}
                                </Badge>
                            )}

                            {/* Reset code button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
                                onClick={() => {
                                    const decision = confirm(
                                        "This action will reset your code editor, and ALL PROGRESS WILL BE LOST. Are you sure?",
                                    );
                                    if (!decision) return;
                                    resetCode();
                                }}
                            >
                                Reset Code
                            </Button>
                        </div>
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

                        {/* I/O Panel */}
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
                                                            Reset test input?
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will reset the
                                                            test input to the
                                                            default value. Any
                                                            custom input you
                                                            {"'"}ve entered will
                                                            be lost.
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
                        <Button
                            variant="outline"
                            onClick={runCode}
                            disabled={runCodeMutator.isPending}
                            className="border-slate-600 bg-slate-700 text-white hover:bg-slate-600"
                        >
                            {runCodeMutator.isPending ? "Running..." : "Run"}
                        </Button>

                        <Button
                            onClick={submitCode}
                            disabled={!canSubmit}
                            title={
                                contestStatus !== "active"
                                    ? "Contest not active"
                                    : undefined
                            }
                            className="bg-green-600 text-white hover:bg-green-700 disabled:bg-slate-600"
                        >
                            {submitCodeMutator.isPending
                                ? "Submitting..."
                                : contestStatus !== "active"
                                  ? "Contest not active"
                                  : "Submit"}
                        </Button>
                    </div>
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
