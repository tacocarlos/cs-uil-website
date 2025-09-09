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
import { Editor } from "@monaco-editor/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

export default function PageCore({ problem }: { problem: Problem }) {
    return (
        <div className="bg-primary flex h-[80vh] flex-col self-center pt-[10vh]">
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
                            <TabsContent value="past-submissions"></TabsContent>
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
                                    Content - Input
                                </TabsContent>
                                <TabsContent value="output">
                                    Content - Output
                                </TabsContent>
                            </Tabs>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
