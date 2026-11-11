"use client";

import { formatDistanceToNow } from "date-fns";
import { api } from "~/trpc/react";
import {
    type RefreshController,
    useRefreshSubscription,
} from "~/hooks/use-refresh-controller";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";

export function RecentContestSubmissions({
    contestId,
    problems,
    refresh,
}: {
    contestId: number;
    problems: { apiProblemId: number; label: string }[];
    refresh: RefreshController;
}) {
    const {
        data: submissions,
        isLoading,
        refetch,
    } = api.contest.getAllSubmissions.useQuery(
        { contestId, limit: 20 },
        { enabled: !isNaN(contestId) },
    );
    useRefreshSubscription(refresh, refetch);

    const problemLabelMap = new Map(
        problems.map((p) => [p.apiProblemId, p.label]),
    );

    return (
        <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold">Recent Submissions</h2>
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Problem</TableHead>
                            <TableHead>Result</TableHead>
                            <TableHead>Points</TableHead>
                            <TableHead>Time</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-muted-foreground py-8 text-center text-sm"
                                >
                                    Loading…
                                </TableCell>
                            </TableRow>
                        ) : !submissions || submissions.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-muted-foreground py-8 text-center text-sm"
                                >
                                    No submissions yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            submissions.map((s) => (
                                <TableRow
                                    key={s.id}
                                    className="hover:bg-muted/50 cursor-pointer"
                                    onClick={() => {
                                        window.location.href = `/dashboard/teacher/contests/${contestId}/submissions/${s.id}`;
                                    }}
                                >
                                    <TableCell>
                                        {s.userName ?? s.userId}
                                    </TableCell>
                                    <TableCell>
                                        {problemLabelMap.get(s.apiProblemId) ??
                                            `#${s.apiProblemId}`}
                                    </TableCell>
                                    <TableCell>
                                        {s.accepted ? (
                                            <Badge className="bg-success/15 text-success">
                                                Accepted
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-destructive/15 text-destructive">
                                                Denied
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{s.points}</TableCell>
                                    <TableCell>
                                        <span
                                            title={new Date(
                                                s.submittedAt,
                                            ).toISOString()}
                                        >
                                            {formatDistanceToNow(
                                                new Date(s.submittedAt),
                                                { addSuffix: true },
                                            )}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </section>
    );
}
