"use client";

import { useState, useRef, useEffect } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "~/components/ui/resizable";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Play, Download, Upload, Copy, Trash } from "lucide-react";
import type { Problem } from "~/server/db/schema/types";

interface CodeEditorProps {
    problem: Problem;
    initialCode?: string;
    initialInput?: string;
    language?: string;
    theme?: "vs-dark" | "light";
    onRun?: (code: string, input: string) => Promise<string>;
    fileName?: string;
}

export function ResizableCodeEditor({
    problem,
    initialCode = "// Write your code here\n",
    initialInput = "",
    language = "java",
    theme = "vs-dark",
    onRun,
    fileName = "Main.java",
}: CodeEditorProps) {
    const [code, setCode] = useState(initialCode);
    const [input, setInput] = useState(initialInput);
    const [output, setOutput] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [isOutputFocused, setIsOutputFocused] = useState(false);

    const codeEditorRef = useRef<any>(null);
    const inputEditorRef = useRef<any>(null);

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        codeEditorRef.current = editor;

        // Set editor options
        editor.updateOptions({
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: "on",
            renderLineHighlight: "all",
            tabSize: 2,
        });
    };

    const handleInputEditorDidMount: OnMount = (editor) => {
        inputEditorRef.current = editor;

        // Set editor options
        editor.updateOptions({
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: "on",
            renderLineHighlight: "all",
            tabSize: 2,
        });
    };

    const handleRunCode = async () => {
        if (!onRun || isRunning) return;

        setIsRunning(true);
        setOutput("Running...");

        try {
            const result = await onRun(code, input);
            setOutput(result);
        } catch (error) {
            setOutput(
                `Error: ${error instanceof Error ? error.message : String(error)}`,
            );
        } finally {
            setIsRunning(false);
        }
    };

    const handleClearOutput = () => {
        setOutput("");
    };

    const handleCopyOutput = () => {
        navigator.clipboard.writeText(output);
    };

    const handleDownloadCode = () => {
        const blob = new Blob([code], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleUploadInput = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".txt,.dat";
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setInput(content);
            };
            reader.readAsText(file);
        };
        input.click();
    };

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+Enter or Cmd+Enter to run code
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleRunCode();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [code, input]);

    useEffect(() => {
        const prevCode = window.localStorage.getItem(
            `lunaghs-problem-${problem.id}`,
        );
        if (prevCode === null) {
            return;
        }
        setCode(prevCode);
        console.log("got previous code");
    }, []);

    return (
        <div className="relative top-72 h-[calc(100vh-8rem)] w-3xl overflow-hidden rounded-lg border">
            <ResizablePanelGroup direction="horizontal">
                {/* Left panel - Code Editor */}
                <ResizablePanel defaultSize={60} minSize={30}>
                    <div className="flex h-full flex-col">
                        <div className="flex items-center justify-between bg-slate-800 p-2 text-white">
                            <div className="font-mono text-sm">{fileName}</div>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDownloadCode}
                                    title="Download code"
                                >
                                    <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={handleRunCode}
                                    disabled={isRunning}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <Play className="mr-1 h-4 w-4" />
                                    Run
                                </Button>
                            </div>
                        </div>
                        <div className="flex-grow">
                            <Editor
                                height="100%"
                                language={language}
                                value={code}
                                theme={theme}
                                onChange={(value) => {
                                    setCode(value || "");
                                    window.localStorage.setItem(
                                        `lunaghs-problem-${problem.id}`,
                                        value || "",
                                    );
                                }}
                                onMount={handleEditorDidMount}
                                options={{
                                    automaticLayout: true,
                                }}
                            />
                        </div>
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Right panel - Output and Input */}
                <ResizablePanel defaultSize={40} minSize={20}>
                    <ResizablePanelGroup direction="vertical">
                        {/* Top-right panel - Output */}
                        <ResizablePanel defaultSize={50} minSize={15}>
                            <Card className="flex h-full flex-col rounded-none border-0">
                                <CardHeader className="flex-row items-center justify-between space-y-0 bg-slate-100 p-2 dark:bg-slate-800">
                                    <CardTitle className="text-sm font-medium">
                                        Output
                                    </CardTitle>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleCopyOutput}
                                            disabled={!output}
                                            title="Copy output"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleClearOutput}
                                            disabled={!output}
                                            title="Clear output"
                                        >
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow overflow-auto p-0">
                                    <pre
                                        className={`h-full p-4 font-mono text-sm whitespace-pre-wrap ${
                                            isOutputFocused
                                                ? "ring-2 ring-blue-500 ring-inset"
                                                : ""
                                        }`}
                                        tabIndex={0}
                                        onFocus={() => setIsOutputFocused(true)}
                                        onBlur={() => setIsOutputFocused(false)}
                                    >
                                        {output ||
                                            "Run your code to see output here"}
                                    </pre>
                                </CardContent>
                            </Card>
                        </ResizablePanel>

                        <ResizableHandle withHandle />

                        {/* Bottom-right panel - Input */}
                        <ResizablePanel defaultSize={50} minSize={15}>
                            <div className="flex h-full flex-col">
                                <div className="flex items-center justify-between bg-slate-100 p-2 dark:bg-slate-800">
                                    <div className="text-sm font-medium">
                                        Input
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleUploadInput}
                                        title="Upload input file"
                                    >
                                        <Upload className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex-grow">
                                    <Editor
                                        height="100%"
                                        language="plaintext"
                                        value={input}
                                        theme={theme}
                                        onChange={(value) => {
                                            setInput(value || "");
                                        }}
                                        onMount={handleInputEditorDidMount}
                                        options={{
                                            automaticLayout: true,
                                            lineNumbers: "off",
                                            minimap: { enabled: false },
                                            scrollBeyondLastLine: false,
                                            wordWrap: "on",
                                        }}
                                    />
                                </div>
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
