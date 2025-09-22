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
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Download, Code, FileText, Check, X } from "lucide-react";
import { type Problem } from "~/server/db/schema/types";
import Link from "next/link";
import type { Submission } from "~/server/db/schema/submission";

export function ProblemAccordionItem({
    problem,
    mostRecentSubmission,
}: {
    problem: Problem;
    mostRecentSubmission?: Submission;
}) {
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

    function RecentSubmissionStatus() {
        if (mostRecentSubmission === undefined) return null;
        if (mostRecentSubmission.accepted) {
            return (
                <span className="flex items-center text-green-600">
                    <Check size={20} />
                    <p>
                        Solution Accepted - {mostRecentSubmission.points}/
                        {mostRecentSubmission.maxPoints}
                    </p>
                </span>
            );
        } else {
            return (
                <span className="flex items-center text-red-600">
                    <X size={20} />
                    <p>Solution Denied</p>
                </span>
            );
        }
    }

    return (
        <AccordionItem
            value={`problem-${problem.id}`}
            className="mb-4 rounded-lg border"
        >
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex w-full flex-col items-start justify-between text-left sm:flex-row sm:items-center">
                    <span className="flex items-center space-x-3 text-lg font-medium">
                        {problem.problemName}
                        <RecentSubmissionStatus />
                    </span>
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
                        <TabsTrigger
                            value="input"
                            className="flex items-center gap-1"
                        >
                            <Code className="h-4 w-4" />
                            Problem Input/Output
                        </TabsTrigger>
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

                    <TabsContent value="input" className="mt-0">
                        <Card>
                            <CardHeader className="text-xl font-semibold">
                                Sample Input
                            </CardHeader>
                            <CardContent>
                                <pre className="rounded-xl bg-gray-100 p-3 text-sm">
                                    {problem.defaultInputFile != "" &&
                                    problem.defaultInputFile != null
                                        ? problem.defaultInputFile
                                        : "No Input Given."}
                                </pre>
                            </CardContent>
                        </Card>
                        <Card className="text-xl">
                            <CardHeader className="text-xl font-semibold">
                                Sample Output
                            </CardHeader>
                            <CardContent>
                                <pre className="rounded-xl bg-gray-100 p-3 text-sm">
                                    {problem.sampleOutput != ""
                                        ? problem.sampleOutput
                                        : "No Output Given."}
                                </pre>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </AccordionContent>
        </AccordionItem>
    );
}
