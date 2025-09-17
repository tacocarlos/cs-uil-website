"use client";

import Markdown from "react-markdown";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "~/components/ui/resizable";
import type { Problem } from "~/server/db/schema/types";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeMathjax from "rehype-mathjax";
import { Editor, type Monaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { useSession } from "auth-client";
import { useRouter } from "next/navigation";
import {
    Card,
    CardAction,
    CardContent,
    CardHeader,
} from "~/components/ui/card";
import { formatDistanceToNow } from "date-fns";

export default function PageCore({ problem }: { problem: Problem }) {
    const { data: session } = useSession();
    const router = useRouter();
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
    const editorRef = useRef<editor.IStandaloneCodeEditor>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    function handleEditorDidMount(
        editor: editor.IStandaloneCodeEditor,
        monaco: Monaco,
    ) {
        editorRef.current = editor;
    }

    const runtimes = api.execute.getJavaRuntimes.useQuery().data;
    const javaRT = runtimes?.at(0) ?? { id: 62, name: "Java" };
    const [output, setOutput] = useState("");
    const runCodeMutator = api.execute.runCode.useMutation({
        onSuccess: async (data) => {
            setOutput(data.stderr ?? data.stdout ?? "");
            toast("Program Has Finished Running");
        },
        onError: async (data) => {
            setOutput(JSON.stringify(data, null, 2));
            toast("Program Has Failed To Run");
        },
    });

    const submitCodeMutator = api.execute.submitCode.useMutation({
        onSuccess: async (data) => {
            setOutput(data.executionResult.stdout ?? "");
            console.dir(data);
            toast(
                `Submitted Code - ${data.accepted ? "Solution Accepted" : "Solution Deined"}`,
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
        const input = inputRef.current?.value ?? "";
        await runCodeMutator.mutateAsync({
            code,
            input,
            languageId: javaRT.id.toString(),
        });
    }

    const pastSubmissions = api.submission.getProblemSubmissions.useQuery({
        problemId: problem.id,
        userId: session?.user.id ?? "",
    }).data;
    const solved = pastSubmissions?.at(0)?.accepted ?? false;
    console.dir(pastSubmissions);

    if (session === null) {
        return <></>;
    }
    return (
        <div className="bg-primary flex h-[100vh] flex-col self-center pt-[10vh]">
            <div className="w-full space-x-5 p-3">
                <Button
                    variant="outline"
                    onClick={() => {
                        runCode();
                    }}
                >
                    Run Code
                </Button>
                <Button
                    disabled={solved}
                    onClick={async () => {
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
                    }}
                >
                    Submit Code
                </Button>
            </div>
            <ResizablePanelGroup
                direction="horizontal"
                className="w-[80vw] rounded-lg border bg-white md:min-w-[450px]"
            >
                <ResizablePanel defaultSize={40}>
                    <div className="m-5">
                        <Tabs defaultValue="problem-statement">
                            <TabsList>
                                <TabsTrigger value="problem-statement">
                                    Problem Statement
                                </TabsTrigger>
                                <TabsTrigger value="past-submissions">
                                    Past Submissions
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="problem-statement">
                                <Markdown
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[rehypeMathjax]}
                                >
                                    {problem.problemText}
                                </Markdown>
                            </TabsContent>
                            <TabsContent value="past-submissions">
                                <ul className="h-96 overflow-scroll">
                                    {pastSubmissions !== undefined ? (
                                        pastSubmissions.map((submission) => {
                                            return (
                                                <Card key={submission.id}>
                                                    <CardHeader>
                                                        Submitted{" "}
                                                        {formatDistanceToNow(
                                                            submission.timeSubmitted,
                                                            { addSuffix: true },
                                                        )}
                                                    </CardHeader>
                                                    <CardContent>
                                                        Submitted Code -{" "}
                                                        {submission.accepted
                                                            ? `Accepted - ${submission.points}/${submission.maxPoints}`
                                                            : "Not Accepted"}
                                                    </CardContent>
                                                    <CardAction>
                                                        <Button
                                                            className="ml-5"
                                                            onClick={() => {
                                                                if (
                                                                    !editorRef.current
                                                                ) {
                                                                    toast(
                                                                        "Editor is not initialized.",
                                                                    );
                                                                    return;
                                                                }
                                                                editorRef.current.setValue(
                                                                    submission.submittedCode,
                                                                );
                                                            }}
                                                        >
                                                            Copy Code To Editor
                                                        </Button>
                                                    </CardAction>
                                                </Card>
                                            );
                                        })
                                    ) : (
                                        <p>No Past Submissions.</p>
                                    )}
                                </ul>
                            </TabsContent>
                        </Tabs>
                    </div>
                </ResizablePanel>
                <ResizableHandle className="w-2 bg-gray-300" />
                <ResizablePanel defaultSize={60}>
                    <ResizablePanelGroup direction="vertical">
                        <ResizablePanel defaultSize={70}>
                            <Editor
                                className=""
                                theme="vs-dark"
                                defaultLanguage="java"
                                height="100%"
                                language="java"
                                options={{
                                    automaticLayout: true,
                                }}
                                onMount={handleEditorDidMount}
                                defaultValue={starterCode}
                            />
                        </ResizablePanel>
                        <ResizableHandle className="h-4 bg-gray-300" />
                        <ResizablePanel defaultSize={30}>
                            <Tabs defaultValue="input">
                                <TabsList>
                                    <TabsTrigger value="input">
                                        Input
                                    </TabsTrigger>
                                    <TabsTrigger value="output">
                                        Output
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="input">
                                    <Textarea
                                        ref={inputRef}
                                        defaultValue={
                                            problem.defaultInputFile ?? ""
                                        }
                                    ></Textarea>
                                </TabsContent>
                                <TabsContent value="output">
                                    <pre>{output}</pre>
                                </TabsContent>
                            </Tabs>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
