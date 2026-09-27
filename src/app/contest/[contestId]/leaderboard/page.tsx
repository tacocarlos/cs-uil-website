"use client";

/**
 * Contest leaderboard page.
 *
 * LeaderboardRefresher (defined inline below) calls router.refresh() every
 * 15 seconds so the RSC leaderboard data re-fetches automatically.  Because
 * this component uses React hooks, the entire file carries `"use client"` so
 * both the refresher and the data queries can live inline per spec.
 *
 * If you want the initial HTML to be server-rendered, extract
 * LeaderboardRefresher to its own `"use client"` file and remove `"use
 * client"` from this file, switching the data fetches to `~/trpc/server`.
 */

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "~/trpc/react";
import { ContestStatusBadge } from "~/components/contest/contest-status-badge";
import { Button } from "~/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── LeaderboardRefresher (inline "use client" component) ─────────────────────
// Renders nothing — silently calls router.refresh() every 15 seconds so the
// leaderboard stays live without a full page reload.

function LeaderboardRefresher() {
    const router = useRouter();

    useEffect(() => {
        const id = setInterval(() => {
            router.refresh();
        }, 15_000);

        return () => clearInterval(id);
    }, [router]);

    return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
    const { contestId: contestIdStr } = useParams<{ contestId: string }>();
    const contestId = parseInt(contestIdStr, 10);

    const { data: contest, isLoading: contestLoading } =
        api.contest.getById.useQuery(
            { contestId },
            { enabled: !isNaN(contestId) },
        );
    const { data: leaderboard, isLoading: lbLoading } =
        api.contest.getLeaderboard.useQuery(
            { contestId },
            { enabled: !isNaN(contestId) },
        );

    if (contestLoading || lbLoading) {
        return (
            <div className="bg-primary flex min-h-screen items-center justify-center pt-20">
                <p className="text-muted-foreground text-sm">Loading…</p>
            </div>
        );
    }

    if (!contest) {
        return (
            <div className="bg-primary min-h-screen px-6 pt-20 pb-12">
                <p className="mt-8 text-center text-red-500">
                    Contest not found.
                </p>
            </div>
        );
    }

    const status = contest.status;

    // Derive the ordered problem-label columns from the contest's problem list
    const problemColumns = [...contest.problems]
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((p) => ({ label: p.label, apiProblemId: p.apiProblemId }));

    return (
        <>
            {/* Silent auto-refresh every 15 s */}
            <LeaderboardRefresher />

            <div className="bg-primary min-h-screen px-6 pt-20 pb-12">
                <div className="text-primary-foreground mx-auto max-w-6xl">
                    {/* ── Header ──────────────────────────────────────────── */}
                    <div className="mb-6 flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link href={`/contest/${contestId}`}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-bold">{contest.name}</h1>
                        <ContestStatusBadge status={status} />
                    </div>

                    {/* ── Frozen banner ────────────────────────────────────── */}
                    {status === "frozen" && (
                        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            ⚠️ Leaderboard is frozen — standings may not reflect
                            final results.
                        </div>
                    )}

                    {/* ── Leaderboard table ────────────────────────────────── */}
                    <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">Rank</TableHead>
                                    <TableHead>Student</TableHead>
                                    {problemColumns.map((col) => (
                                        <TableHead
                                            key={col.apiProblemId}
                                            className="text-center"
                                        >
                                            {col.label}
                                        </TableHead>
                                    ))}
                                    <TableHead className="text-right">
                                        Total
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Solved
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!leaderboard || leaderboard.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4 + problemColumns.length}
                                            className="text-muted-foreground py-12 text-center text-sm"
                                        >
                                            No participants yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    leaderboard.map((entry, i) => (
                                        <TableRow key={entry.userId}>
                                            {/* Rank */}
                                            <TableCell className="w-16 font-medium">
                                                {i + 1}
                                            </TableCell>

                                            {/* Student name */}
                                            <TableCell>
                                                {entry.userName}
                                            </TableCell>

                                            {/* Per-problem cells */}
                                            {problemColumns.map((col) => {
                                                const prob =
                                                    entry.problems?.find(
                                                        (ep) =>
                                                            ep.apiProblemId ===
                                                            col.apiProblemId,
                                                    );

                                                if (!prob) {
                                                    return (
                                                        <TableCell
                                                            key={
                                                                col.apiProblemId
                                                            }
                                                            className="text-muted-foreground text-center"
                                                        >
                                                            —
                                                        </TableCell>
                                                    );
                                                }

                                                if (prob.accepted) {
                                                    return (
                                                        <TableCell
                                                            key={
                                                                col.apiProblemId
                                                            }
                                                            className="text-center font-medium text-green-600"
                                                        >
                                                            ✓ {prob.points}
                                                        </TableCell>
                                                    );
                                                }

                                                return (
                                                    <TableCell
                                                        key={col.apiProblemId}
                                                        className="text-center text-red-500"
                                                    >
                                                        ✗{" "}
                                                        {prob.attempts > 0
                                                            ? `${prob.attempts}×`
                                                            : ""}
                                                    </TableCell>
                                                );
                                            })}

                                            {/* Total points */}
                                            <TableCell className="text-right font-bold">
                                                {entry.totalPoints}
                                            </TableCell>

                                            {/* Solved count */}
                                            <TableCell className="text-center">
                                                {entry.solvedCount}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </>
    );
}
