"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Progress } from "~/components/ui/progress";
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ExternalLink,
} from "lucide-react";
import type { Problem } from "~/server/db/schema/types";
import type { Submission } from "~/server/db/schema/submission";

export function ProblemStatusCard({
    problem,
    submission,
}: {
    problem: Problem;
    submission?: Submission;
}) {
    const hasSubmission = submission !== undefined;
    const isAccepted = hasSubmission && submission.accepted;
    const maxPoints = 30; // Assuming max points is 100 
    const formatLevel = (level: string) => {
        return level.charAt(0).toUpperCase() + level.slice(1);
    };

    const compLevel = formatLevel(problem.competitionLevel);

    return (
        <Card className="flex flex-col justify-between">
            <CardHeader>
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">
                        Most Recent Problem
                        <div className="italic">{problem.problemName}</div>
                    </CardTitle>
                    <Badge variant="secondary">{compLevel}</Badge>
                </div>
                <CardDescription>
                    {problem.competitionYear} {compLevel}
                </CardDescription>
            </CardHeader>

            <CardContent>
                {!hasSubmission ? (
                    <div className="py-4 text-center">
                        <p className="text-muted-foreground text-sm">
                            No submissions yet.
                        </p>
                        <p className="font-semibold">Ready to start?</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            {isAccepted ? (
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                            ) : (
                                <XCircle className="h-6 w-6 text-red-500" />
                            )}
                            <span
                                className={`text-lg font-bold ${
                                    isAccepted
                                        ? "text-green-600"
                                        : "text-red-600"
                                }`}
                            >
                                {isAccepted ? "Accepted" : "Needs Improvement"}
                            </span>
                        </div>
                        <div>
                            <div className="mb-1 flex items-baseline justify-between">
                                <span className="text-muted-foreground text-sm font-medium">
                                    Score
                                </span>
                                <span className="font-semibold">
                                    {submission.points} / {maxPoints}
                                </span>
                            </div>
                            <Progress
                                value={submission.points * (100 / maxPoints)}
                                className="h-2"
                            />
                        </div>
                        <p className="text-muted-foreground text-xs">
                            Last attempt:{" "}
                            {formatDistanceToNow(
                                new Date(submission.timeSubmitted),
                                {
                                    addSuffix: true,
                                },
                            )}
                        </p>
                    </div>
                )}
            </CardContent>

            <CardFooter>
                <Link
                    href={`/resources/past-problem/${problem.id}`}
                    passHref
                    className="w-full"
                >
                    <Button className="w-full">
                        {hasSubmission ? "Review Problem" : "Start Problem"}
                        <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}
