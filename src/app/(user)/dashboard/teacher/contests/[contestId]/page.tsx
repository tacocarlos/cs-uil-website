"use client";

/**
 * Teacher contest management page.
 *
 * This file is a client component so that ContestControls (with its
 * useMutation + useRouter calls) can live inline in the same file.
 * `export const dynamic = "force-dynamic"` prevents static caching.
 */

export const dynamic = "force-dynamic";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow, isPast } from "date-fns";
import { ArrowLeft, BookOpen, Clock, Edit, Users } from "lucide-react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import { ContestStatusBadge } from "~/components/contest/contest-status-badge";
import type { ContestStatus } from "~/server/db/schema/contest";

// ─── ContestControls (inline "use client" component) ─────────────────────────

function ContestControls({
    contestId,
    status,
}: {
    contestId: number;
    status: ContestStatus;
}) {
    const router = useRouter();
    const setStatus = api.contest.setStatus.useMutation({
        onSuccess: () => {
            toast.success("Contest status updated.");
            router.refresh();
        },
        onError: (err) => toast.error(err.message),
    });

    const mutate = (next: ContestStatus) =>
        setStatus.mutate({ contestId, status: next });

    return (
        <div className="flex flex-wrap items-center gap-2">
            {status === "draft" && (
                <Button
                    onClick={() => mutate("scheduled")}
                    disabled={setStatus.isPending}
                >
                    Publish
                </Button>
            )}

            {status === "scheduled" && (
                <Button
                    onClick={() => mutate("active")}
                    disabled={setStatus.isPending}
                >
                    Start Now
                </Button>
            )}

            {status === "active" && (
                <>
                    <Button
                        variant="outline"
                        onClick={() => mutate("frozen")}
                        disabled={setStatus.isPending}
                    >
                        Freeze Leaderboard
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => mutate("ended")}
                        disabled={setStatus.isPending}
                    >
                        End Contest
                    </Button>
                </>
            )}

            {status === "frozen" && (
                <Button
                    variant="destructive"
                    onClick={() => mutate("ended")}
                    disabled={setStatus.isPending}
                >
                    End Contest
                </Button>
            )}

            <Button asChild variant="ghost" size="sm">
                <Link href={`/dashboard/teacher/contests/${contestId}/edit`}>
                    <Edit className="mr-1 h-4 w-4" />
                    Edit
                </Link>
            </Button>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeacherContestPage() {
    const { contestId: contestIdStr } = useParams<{ contestId: string }>();
    const contestId = parseInt(contestIdStr, 10);

    const { data: contest, isLoading: contestLoading } =
        api.contest.getById.useQuery(
            { contestId },
            { enabled: !isNaN(contestId) },
        );
    const { data: submissions, isLoading: subsLoading } =
        api.contest.getAllSubmissions.useQuery(
            { contestId, limit: 20 },
            { enabled: !isNaN(contestId) },
        );
    const { data: leaderboard, isLoading: lbLoading } =
        api.contest.getLeaderboard.useQuery(
            { contestId },
            { enabled: !isNaN(contestId) },
        );

    if (contestLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 pt-20">
                <p className="text-muted-foreground text-sm">Loading…</p>
            </div>
        );
    }

    if (!contest) {
        return (
            <div className="min-h-screen bg-gray-50 px-8 pt-20 pb-8">
                <p className="mt-8 text-center text-red-500">
                    Contest not found.
                </p>
            </div>
        );
    }

    const status = contest.status;

    // Build label map from contest problems for the submissions table
    const problemLabelMap = new Map(
        contest.problems.map((p) => [p.apiProblemId, p.label]),
    );

    const timeLabel = isPast(contest.endsAt)
        ? "Ended"
        : formatDistanceToNow(contest.endsAt, { addSuffix: true });

    const sortedProblems = [...contest.problems].sort(
        (a, b) => a.displayOrder - b.displayOrder,
    );

    return (
        <div className="min-h-screen bg-gray-50 px-8 pt-20 pb-8">
            <div className="mx-auto max-w-6xl">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link href="/dashboard/teacher/contests">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-bold">{contest.name}</h1>
                        <ContestStatusBadge status={status} />
                    </div>

                    <ContestControls contestId={contestId} status={status} />
                </div>

                {/* ── Stats row ───────────────────────────────────────────── */}
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Problems
                            </CardTitle>
                            <BookOpen className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">
                                {contest.problems.length}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Participants
                            </CardTitle>
                            <Users className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">
                                {contest.participantCount}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Time Remaining
                            </CardTitle>
                            <Clock className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{timeLabel}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Problems list ────────────────────────────────────────── */}
                <section className="mb-8">
                    <h2 className="mb-4 text-lg font-semibold">Problems</h2>
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Label</TableHead>
                                    <TableHead>API Problem ID</TableHead>
                                    <TableHead>Max Points</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedProblems.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={3}
                                            className="text-muted-foreground py-8 text-center text-sm"
                                        >
                                            No problems added yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedProblems.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium">
                                                {p.label}
                                            </TableCell>
                                            <TableCell>
                                                {p.apiProblemId}
                                            </TableCell>
                                            <TableCell>{p.maxPoints}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </section>

                {/* ── Recent Submissions ───────────────────────────────────── */}
                <section className="mb-8">
                    <h2 className="mb-4 text-lg font-semibold">
                        Recent Submissions
                    </h2>
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
                                {subsLoading ? (
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
                                                {problemLabelMap.get(
                                                    s.apiProblemId,
                                                ) ?? `#${s.apiProblemId}`}
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

                {/* ── Leaderboard preview ──────────────────────────────────── */}
                <section>
                    <h2 className="mb-4 text-lg font-semibold">
                        Leaderboard Preview
                    </h2>
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
                                {lbLoading ? (
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
                                    leaderboard.slice(0, 5).map((entry, i) => (
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
            </div>
        </div>
    );
}
