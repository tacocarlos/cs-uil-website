"use client";

import { api } from "~/trpc/react";
import {
    type RefreshController,
    useRefreshSubscription,
} from "~/hooks/use-refresh-controller";
import { Card } from "~/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";

/** Number of top entries shown in the preview. */
const PREVIEW_SIZE = 5;

export function LeaderboardPreview({
    contestId,
    refresh,
}: {
    contestId: number;
    refresh: RefreshController;
}) {
    const {
        data: leaderboard,
        isLoading,
        refetch,
    } = api.contest.getLeaderboard.useQuery(
        { contestId },
        { enabled: !isNaN(contestId) },
    );
    useRefreshSubscription(refresh, refetch);

    return (
        <section>
            <h2 className="mb-4 text-lg font-semibold">Leaderboard Preview</h2>
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-16">Rank</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Total Points</TableHead>
                            <TableHead>Solved</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="text-muted-foreground py-8 text-center text-sm"
                                >
                                    Loading…
                                </TableCell>
                            </TableRow>
                        ) : !leaderboard || leaderboard.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="text-muted-foreground py-8 text-center text-sm"
                                >
                                    No entries yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            leaderboard
                                .slice(0, PREVIEW_SIZE)
                                .map((entry, i) => (
                                    <TableRow key={entry.userId}>
                                        <TableCell className="font-medium">
                                            {i + 1}
                                        </TableCell>
                                        <TableCell>
                                            {entry.userName}
                                            {entry.schoolName && (
                                                <span className="text-muted-foreground block text-xs">
                                                    {entry.schoolName}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {entry.totalPoints}
                                        </TableCell>
                                        <TableCell>
                                            {entry.solvedCount}
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
