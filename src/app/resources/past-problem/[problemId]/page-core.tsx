"use client";

import Markdown from "react-markdown";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "~/components/ui/resizable";
import type { Problem } from "~/server/db/schema/types";
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
import ProblemStatement from "./components/problem-statement";
import PastSubmissions from "./components/past-submissions";

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
    function handleEditorDidMount(
        editor: editor.IStandaloneCodeEditor,
        monaco: Monaco,
    ) {
        editorRef.current = editor;
    }
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const [stdOut, setStdOut] = useState("");
    const [stdErr, setStdErr] = useState("");

    const [ioTab, setIOTab] = useState<"input" | "stderr" | "stdout">("input");

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
            if (data.stdout) setIOTab("stdout");
            else if (data.stderr) setIOTab("stderr");
            toast("Program Has Finished Running");
        },
        onError: async (data) => {
            setStdOut("Problem Has Failed To Run");
            setStdErr("Problem Has Failed To Run");
            toast("Program Has Failed To Run");
        },
    });

    const submitCodeMutator = api.execute.submitCode.useMutation({
        onSuccess: async (data) => {
            utils.submission.invalidate();
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
                    disabled={solved || submitCodeMutator.isPending}
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
                className="w-[80vw] rounded-lg border bg-white p-1 md:min-w-[450px]"
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
                            <TabsContent
                                value="problem-statement"
                                className="prose max-h-[300px] w-full grow basis-3xl flex-col"
                            >
                                <ProblemStatement problem={problem} />
                            </TabsContent>
                            <TabsContent value="past-submissions">
                                <PastSubmissions
                                    submissions={pastSubmissions ?? []}
                                />
                                {/* <ul className="h-96 overflow-scroll">
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
                                </ul> */}
                            </TabsContent>
                        </Tabs>
                    </div>
                </ResizablePanel>
                <ResizableHandle className="w-2 bg-gray-300" />
                <ResizablePanel defaultSize={60}>
                    <ResizablePanelGroup direction="vertical">
                        <ResizablePanel defaultSize={70}>
                            <Editor
                                className="rounded-md bg-stone-800 p-2"
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
                            <Tabs defaultValue={ioTab} value={ioTab}>
                                <TabsList>
                                    <TabsTrigger
                                        value="input"
                                        onClick={() => setIOTab("input")}
                                    >
                                        Input
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="stdout"
                                        onClick={() => setIOTab("stdout")}
                                    >
                                        stdout
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="stderr"
                                        onClick={() => setIOTab("stderr")}
                                    >
                                        stderr
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="input">
                                    <Textarea
                                        className="h-[200px] max-h-[250px]"
                                        ref={inputRef}
                                        defaultValue={
                                            problem.defaultInputFile ?? ""
                                        }
                                    />
                                </TabsContent>
                                <TabsContent value="stdout">
                                    <Textarea
                                        className="h-[200px] max-h-[250px] overflow-auto"
                                        value={stdOut}
                                        readOnly
                                    />
                                </TabsContent>
                                <TabsContent value="stderr">
                                    <Textarea
                                        className="h-[200px] max-h-[250px] overflow-auto"
                                        value={stdErr}
                                        readOnly
                                    />
                                </TabsContent>
                            </Tabs>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
