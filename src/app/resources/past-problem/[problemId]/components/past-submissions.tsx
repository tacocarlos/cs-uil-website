"use client";
import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import type { Submission } from "~/server/db/schema/submission";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { format } from "date-fns";
import { Check, X } from "lucide-react";
import { Button } from "~/components/ui/button";

function SubmissionInformation({ submission }: { submission: Submission }) {
    return (
        <div className="space-y-3">
            <header>ID: {submission.id}</header>
            {submission.accepted ? (
                <span className="flex">
                    <Check className="text-green-600" />
                    <p>
                        {" "}
                        {submission.points}/{submission.maxPoints} points
                    </p>
                </span>
            ) : (
                <span className="flex">
                    <X className="text-red-600" />
                    <p>Not Accepted</p>
                </span>
            )}
            <section className="prose h-80 w-full max-w-none overflow-y-auto p-[10px]">
                <header className="text-primary text-xl font-semibold">
                    Submitted Code
                </header>
                <Markdown remarkPlugins={[remarkGfm]}>
                    {`\`\`\`java
${submission.submittedCode}
\`\`\``}
                </Markdown>
            </section>
        </div>
    );
}

export default function PastSubmissions({
    submissions,
}: {
    submissions: Submission[];
}) {
    const [selectedSubmission, setSelectedSubmission] = useState<
        Submission | undefined
    >(undefined);
    return (
        <>
            <Select
                onValueChange={(choice) => {
                    setSelectedSubmission(
                        submissions.find((s) => s.id === choice),
                    );
                }}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Problem" />
                </SelectTrigger>
                <SelectContent>
                    {submissions.map((s, idx) => {
                        return (
                            <SelectItem key={s.id} value={s.id}>
                                {s.accepted ? (
                                    <Check className="text-green-600" />
                                ) : (
                                    <X className="text-red-600" />
                                )}
                                #{submissions.length - idx}:{" "}
                                {format(s.timeSubmitted, "PPPPpppp")}
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>
            {selectedSubmission !== undefined ? (
                <SubmissionInformation submission={selectedSubmission} />
            ) : null}
        </>
    );
}
