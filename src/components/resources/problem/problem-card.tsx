"use client";

import { useState } from "react";
import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeMathjax from "rehype-mathjax";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { CheckCircle2, XCircle, Download, Code, FileText } from "lucide-react";
import { type Problem } from "~/server/db/schema/types";
import type { Submission } from "~/server/db/schema/submission";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatLevel(level: string) {
    return level.charAt(0).toUpperCase() + level.slice(1);
}

function levelBadgeClass(level: string) {
    switch (level) {
        case "district":
            return "bg-green-100 text-green-800 hover:bg-green-200";
        case "region":
            return "bg-blue-100 text-blue-800 hover:bg-blue-200";
        case "state":
            return "bg-purple-100 text-purple-800 hover:bg-purple-200";
        default:
            return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
}

// ── Preview modal ─────────────────────────────────────────────────────────────

function ProblemPreviewModal({
    problem,
    mostRecentSubmission,
    open,
    onOpenChange,
}: {
    problem: Problem;
    mostRecentSubmission?: Submission;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    function downloadInput() {
        const blob = new Blob([problem.defaultInputFile ?? ""], {
            type: "text/plain",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = problem.inputFileName ?? "input.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-0 p-0">
                {/* Fixed header */}
                <DialogHeader className="border-b px-6 pt-6 pb-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <DialogTitle className="text-xl">
                            {problem.problemName}
                        </DialogTitle>
                        <div className="mr-4 flex flex-wrap gap-1.5">
                            <Badge variant="outline">
                                {problem.competitionYear}
                            </Badge>
                            <Badge
                                variant="outline"
                                className={levelBadgeClass(
                                    problem.competitionLevel,
                                )}
                            >
                                {formatLevel(problem.competitionLevel)}
                            </Badge>
                            {problem.programName && (
                                <Badge
                                    variant="outline"
                                    className="bg-amber-100 text-amber-800"
                                >
                                    {problem.programName}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {mostRecentSubmission && (
                        <div className="mt-2">
                            {mostRecentSubmission.accepted ? (
                                <span className="flex items-center gap-1.5 text-sm text-green-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Accepted &mdash;{" "}
                                    {mostRecentSubmission.points}/
                                    {mostRecentSubmission.maxPoints} pts
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-sm text-red-600">
                                    <XCircle className="h-4 w-4" />
                                    Not yet accepted
                                </span>
                            )}
                        </div>
                    )}
                </DialogHeader>

                {/* Scrollable body */}
                <Tabs
                    defaultValue="description"
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <TabsList className="mx-6 mt-4 w-fit">
                        <TabsTrigger
                            value="description"
                            className="flex items-center gap-1.5"
                        >
                            <FileText className="h-4 w-4" />
                            Description
                        </TabsTrigger>
                        <TabsTrigger
                            value="io"
                            className="flex items-center gap-1.5"
                        >
                            <Code className="h-4 w-4" />
                            Sample I/O
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent
                        value="description"
                        className="mt-0 min-h-0 flex-1 overflow-y-auto px-6 py-4"
                    >
                        <div className="prose prose-sm max-w-none">
                            <Markdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeMathjax]}
                            >
                                {problem.problemText ||
                                    "*No description available.*"}
                            </Markdown>
                        </div>
                        {(problem.programName || problem.inputFileName) && (
                            <div className="mt-4 border-t pt-4 text-sm">
                                <p className="mb-1 font-medium">
                                    Problem details
                                </p>
                                <ul className="text-muted-foreground space-y-0.5">
                                    {problem.programName && (
                                        <li>
                                            Program:{" "}
                                            <span className="font-mono">
                                                {problem.programName}
                                            </span>
                                        </li>
                                    )}
                                    {problem.inputFileName && (
                                        <li>
                                            Input file:{" "}
                                            <span className="font-mono">
                                                {problem.inputFileName}
                                            </span>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent
                        value="io"
                        className="mt-0 min-h-0 flex-1 overflow-y-auto px-6 py-4"
                    >
                        <div className="space-y-4">
                            <div>
                                <p className="mb-1.5 text-sm font-medium">
                                    Sample input
                                </p>
                                <pre className="bg-muted overflow-x-auto rounded-md p-3 font-mono text-sm">
                                    {problem.defaultInputFile?.trim() ||
                                        "No input given for this problem."}
                                </pre>
                            </div>
                            <div>
                                <p className="mb-1.5 text-sm font-medium">
                                    Sample output
                                </p>
                                <pre className="bg-muted overflow-x-auto rounded-md p-3 font-mono text-sm">
                                    {problem.sampleOutput?.trim() ||
                                        "No output given for this problem."}
                                </pre>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Fixed footer */}
                <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
                    {problem.defaultInputFile && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadInput}
                        >
                            <Download className="mr-1.5 h-4 w-4" />
                            Download input
                        </Button>
                    )}
                    <Button asChild size="sm">
                        <Link href={`/resources/past-problem/${problem.id}`}>
                            <Code className="mr-1.5 h-4 w-4" />
                            Attempt problem
                        </Link>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Card ──────────────────────────────────────────────────────────────────────

export function ProblemCard({
    problem,
    mostRecentSubmission,
}: {
    problem: Problem;
    mostRecentSubmission?: Submission;
}) {
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <>
            <Card
                className="flex cursor-pointer flex-col transition-shadow hover:shadow-md"
                onClick={() => setModalOpen(true)}
            >
                <CardHeader className="pb-2">
                    <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-xs">
                            {problem.competitionYear}
                        </Badge>
                        <Badge
                            variant="outline"
                            className={`text-xs ${levelBadgeClass(problem.competitionLevel)}`}
                        >
                            {formatLevel(problem.competitionLevel)}
                        </Badge>
                        {problem.programName && (
                            <Badge
                                variant="outline"
                                className="bg-amber-100 text-xs text-amber-800"
                            >
                                {problem.programName}
                            </Badge>
                        )}
                    </div>
                    <CardTitle className="mt-1 text-base leading-snug">
                        {problem.problemName}
                    </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 pb-2">
                    {mostRecentSubmission ? (
                        mostRecentSubmission.accepted ? (
                            <span className="flex items-center gap-1.5 text-sm text-green-600">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                Accepted &mdash; {mostRecentSubmission.points}/
                                {mostRecentSubmission.maxPoints} pts
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-sm text-red-500">
                                <XCircle className="h-4 w-4 shrink-0" />
                                Not yet accepted
                            </span>
                        )
                    ) : (
                        <p className="text-muted-foreground text-sm">
                            Not attempted
                        </p>
                    )}
                </CardContent>

                <CardFooter className="pt-2">
                    <span className="text-muted-foreground text-xs">
                        Click to preview
                    </span>
                </CardFooter>
            </Card>

            <ProblemPreviewModal
                problem={problem}
                mostRecentSubmission={mostRecentSubmission}
                open={modalOpen}
                onOpenChange={setModalOpen}
            />
        </>
    );
}
