"use client";

import { formatDistanceToNow } from "date-fns";
import { Table } from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import Link from "next/link";
import { TableHeader, TableRow, TableHead, TableBody, TableCell } from "~/components/ui/table";
import { api } from "~/trpc/react";
import { Skeleton } from "~/components/ui/skeleton";

export function RecentOrgSubmissions() {
    const {data: apiProblems, isPending: problemsPending, refetch: refetchProblems} = api.problem.getMinimalProblems.useQuery();
    const {data: submissions, isPending: submissionsPending, refetch: refetchSubmissions} = api.submission.getRecentOrgSubmission.useQuery({}, {refetchInterval: 5000, refetchOnWindowFocus: true});

    if(submissionsPending || problemsPending) {
        return <Skeleton className="w-full h-10"/>
    }

    if(submissions == undefined || apiProblems == undefined) {
        return <p>Failed to get submissions.</p>
    }

    const problemNameMap = new Map(apiProblems.map((p) => [p.id, p.name]));

    return <>
                <h2 className="mb-4 text-lg font-semibold">
                    Recent Submissions
                </h2>

                {submissions.length === 0 ? (
                    <p className="text-muted-foreground py-12 text-center text-sm">
                        No submissions yet.
                    </p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Problem</TableHead>
                                <TableHead>Submitted</TableHead>
                                <TableHead>Attempt Number</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {submissions.map((s) => {
                                const studentLabel =
                                    s.userName ?? s.userEmail ?? s.userId;
                                const problemLabel =
                                    problemNameMap.get(s.problemId) ??
                                    `Problem #${s.problemId}`;

                                return (
                                    <TableRow key={s.id}>
                                        <TableCell>{studentLabel}</TableCell>
                                        <TableCell>{problemLabel}</TableCell>
                                        <TableCell>
                                            <span
                                                title={s.timeSubmitted.toISOString()}
                                            >
                                                {formatDistanceToNow(
                                                    s.timeSubmitted,
                                                    { addSuffix: true },
                                                )}
                                            </span>
                                        </TableCell>
                                        <TableCell>{s.attemptNum}</TableCell>
                                        <TableCell>
                                            {s.points} / {s.maxPoints}
                                        </TableCell>
                                        <TableCell>
                                            {s.accepted ? (
                                                <Badge className="bg-green-100 text-green-800">
                                                    Accepted
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-red-100 text-red-800">
                                                    Denied
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                            >
                                                <Link
                                                    href={`/dashboard/teacher/submissions/${s.id}`}
                                                >
                                                    View
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </>

}