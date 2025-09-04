"use client";

import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeMathjax from "rehype-mathjax";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Download, Code, FileText } from "lucide-react";
import { type Problem } from "~/server/db/schema/types";
import Link from "next/link";

export function ProblemAccordionItem({ problem }: { problem: Problem }) {
    const [activeTab, setActiveTab] = useState("description");

    // Format competition level with proper capitalization
    const formatLevel = (level: string) => {
        return level.charAt(0).toUpperCase() + level.slice(1);
    };

    // Get badge color based on competition level
    const getLevelColor = (level: string) => {
        switch (level.toLowerCase()) {
            case "district":
                return "bg-green-100 text-green-800 hover:bg-green-200";
            case "region":
                return "bg-blue-100 text-blue-800 hover:bg-blue-200";
            case "state":
                return "bg-purple-100 text-purple-800 hover:bg-purple-200";
            default:
                return "bg-red-100 text-gray-800 hover:bg-gray-200";
        }
    };

    return (
        <AccordionItem
            value={`problem-${problem.id}`}
            className="mb-4 rounded-lg border"
        >
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex w-full flex-col items-start justify-between text-left sm:flex-row sm:items-center">
                    <div className="text-lg font-medium">
                        {problem.problemName}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 sm:mt-0">
                        <Badge variant="outline" className="font-normal">
                            {problem.competitionYear}
                        </Badge>
                        <Badge
                            variant="outline"
                            className={`font-normal ${getLevelColor(problem.competitionLevel)}`}
                        >
                            {formatLevel(problem.competitionLevel)}
                        </Badge>
                        {problem.programName && (
                            <Badge
                                variant="outline"
                                className="bg-amber-100 font-normal text-amber-800"
                            >
                                {problem.programName}
                            </Badge>
                        )}
                    </div>
                </div>
            </AccordionTrigger>

            <AccordionContent className="px-4 pt-2 pb-4">
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                >
                    <TabsList className="mb-4">
                        <TabsTrigger
                            value="description"
                            className="flex items-center gap-1"
                        >
                            <FileText className="h-4 w-4" />
                            Description
                        </TabsTrigger>
                        {problem.defaultInputFile && (
                            <TabsTrigger
                                value="input"
                                className="flex items-center gap-1"
                            >
                                <Code className="h-4 w-4" />
                                Sample Input
                            </TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="description" className="mt-0">
                        <Card className="p-4">
                            <div className="prose max-w-none">
                                <Markdown
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[rehypeMathjax]}
                                >
                                    {problem.problemText}
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
                                                <span className="font-medium">
                                                    Input File:
                                                </span>{" "}
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
                                                [
                                                    problem.defaultInputFile ||
                                                        "",
                                                ],
                                                {
                                                    type: "text/plain",
                                                },
                                            );
                                            const url =
                                                URL.createObjectURL(blob);
                                            const a =
                                                document.createElement("a");
                                            a.href = url;
                                            a.download =
                                                problem.inputFileName ||
                                                "input.txt";
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
                                    <Link
                                        href={`/resources/past-problem/${problem.id}`}
                                    >
                                        <Code className="mr-1 h-4 w-4" />
                                        Attempt Problem
                                    </Link>
                                </Button>
                            </div>
                        </Card>
                    </TabsContent>

                    {problem.defaultInputFile && (
                        <TabsContent value="input" className="mt-0">
                            <Card className="p-4">
                                <pre className="overflow-x-auto rounded-md bg-gray-50 p-4 text-sm">
                                    {problem.defaultInputFile}
                                </pre>
                            </Card>
                        </TabsContent>
                    )}
                </Tabs>
            </AccordionContent>
        </AccordionItem>
    );
}
