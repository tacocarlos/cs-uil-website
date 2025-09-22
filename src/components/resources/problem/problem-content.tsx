"use client";

import { Download, Link, Code } from "lucide-react";
import { Button } from "~/components/ui/button";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeMathjax from "rehype-mathjax";
import { Card } from "~/components/ui/card";
import type { Problem } from "~/server/db/schema/types";

export default function Content({ problem }: { problem: Problem }) {
    return (
        <Card className="p-4">
            <div className="prose max-w-none">
                <Markdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeMathjax]}
                >
                    {`${problem.problemText}

## Input
\`\`\`
${problem.defaultInputFile}
\`\`\`

## Output
\`\`\`
${problem.sampleOutput}
\`\`\`
`}
                </Markdown>
                <div className="mt-6 border-t pt-4">
                    <h4 className="mb-2 text-sm font-semibold">
                        Problem Details:
                    </h4>
                    <ul className="space-y-1 text-sm">
                        {problem.programName && (
                            <li>
                                <span className="font-medium">
                                    Program Name:
                                </span>{" "}
                                {problem.programName}
                            </li>
                        )}
                        {problem.inputFileName && (
                            <li>
                                <span className="font-medium">Input File:</span>{" "}
                                {problem.inputFileName}
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
                {problem.defaultInputFile && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={(e) => {
                            e.stopPropagation();
                            // Logic to download input file
                            const blob = new Blob(
                                [problem.defaultInputFile || ""],
                                {
                                    type: "text/plain",
                                },
                            );
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = problem.inputFileName || "input.txt";
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        }}
                    >
                        <Download className="mr-1 h-4 w-4" />
                        Download Input File
                    </Button>
                )}
                <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 bg-green-900 text-white hover:bg-blue-400 hover:text-black"
                >
                    <Link href={`/resources/past-problem/${problem.id}`}>
                        {/* <Code className="mr-1 h-4 w-4" /> */}
                        Attempt Problem
                    </Link>
                </Button>
            </div>
        </Card>
    );
}
