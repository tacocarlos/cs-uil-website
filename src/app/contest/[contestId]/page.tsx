/** Student contest lobby — server component. */

export const dynamic = "force-dynamic";

import { auth } from "auth";
import { headers } from "next/headers";
import Link from "next/link";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { CheckCircle, Lock, XCircle } from "lucide-react";
import { api } from "~/trpc/server";
import { getAllMinimalProblems } from "~/lib/api/lunaghs";
import { ContestStatusBadge } from "~/components/contest/contest-status-badge";
import { Button } from "~/components/ui/button";
import { EnrollButton } from "./_enroll-button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ContestLobbyPage({
    params,
}: {
    params: Promise<{ contestId: string }>;
}) {
    const { contestId: contestIdStr } = await params;
    const contestId = parseInt(contestIdStr, 10);

    // 1. Parallel: contest data, session, external problem names
    const [session, contest, apiProblems] = await Promise.all([
        auth.api.getSession({ headers: await headers() }),
        api.contest.getById({ contestId }),
        getAllMinimalProblems(),
    ]);

    if (!contest) {
        return (
            <div className="bg-primary min-h-screen pt-20">
                <p className="mt-12 text-center text-red-500">
                    Contest not found.
                </p>
            </div>
        );
    }

    const signedIn = !!session;

    // 2. Enrollment and per-problem best, for the signed-in user
    const isEnrolled = signedIn
        ? await api.contest.isEnrolled({ contestId })
        : false;
    const myBest = isEnrolled
        ? await api.contest.getMyBestPerProblem({ contestId })
        : [];

    // 4. Problem name lookup map
    const problemNameMap = new Map(apiProblems.map((p) => [p.id, p.name]));

    const status = contest.status;
    const canEnroll =
        !isEnrolled &&
        (status === "active" || status === "scheduled") &&
        signedIn;

    const sortedProblems = [...contest.problems].sort(
        (a, b) => a.displayOrder - b.displayOrder,
    );

    return (
        <div className="bg-primary min-h-screen pt-20">
            <div className="text-primary-foreground mx-auto max-w-4xl px-6 pb-12">
                {/* ── Contest header card ──────────────────────────────────── */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <CardTitle className="text-2xl">
                                    {contest.name}
                                </CardTitle>
                                {contest.description && (
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        {contest.description}
                                    </p>
                                )}
                            </div>
                            <ContestStatusBadge status={status} />
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                        <div>
                            <p className="text-muted-foreground font-medium">
                                Starts
                            </p>
                            <p>
                                {format(contest.startsAt, "MMM d, yyyy h:mm a")}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground font-medium">
                                Ends
                            </p>
                            <p>
                                {format(contest.endsAt, "MMM d, yyyy h:mm a")}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground font-medium">
                                Time Remaining
                            </p>
                            <p>
                                {isPast(contest.endsAt)
                                    ? "Ended"
                                    : formatDistanceToNow(contest.endsAt, {
                                          addSuffix: true,
                                      })}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Enrollment banner ────────────────────────────────────── */}
                {canEnroll && (
                    <div className="mb-6 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                        <p className="text-sm text-blue-800">
                            You are not enrolled in this contest.
                        </p>
                        <EnrollButton contestId={contestId} />
                    </div>
                )}

                {/* ── Problems table ───────────────────────────────────────── */}
                <section className="mb-6">
                    <h2 className="mb-4 text-lg font-semibold">Problems</h2>
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-20">
                                        Label
                                    </TableHead>
                                    <TableHead>Problem</TableHead>
                                    <TableHead className="w-28">
                                        Max Points
                                    </TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-24" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedProblems.map((p) => {
                                    const best = myBest.find(
                                        (b) =>
                                            b.apiProblemId === p.apiProblemId,
                                    );

                                    let statusCell: React.ReactNode;
                                    if (!isEnrolled) {
                                        statusCell = (
                                            <span className="text-muted-foreground">
                                                —
                                            </span>
                                        );
                                    } else if (best?.accepted) {
                                        statusCell = (
                                            <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                                                <CheckCircle className="h-4 w-4" />
                                                Accepted
                                            </span>
                                        );
                                    } else if (best) {
                                        statusCell = (
                                            <span className="flex items-center gap-1 text-sm text-red-600">
                                                <XCircle className="h-4 w-4" />
                                                {best.attemptNumber} attempt
                                                {best.attemptNumber !== 1
                                                    ? "s"
                                                    : ""}
                                            </span>
                                        );
                                    } else {
                                        statusCell = (
                                            <span className="text-muted-foreground text-sm">
                                                — Not started
                                            </span>
                                        );
                                    }

                                    return (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium">
                                                {p.label}
                                            </TableCell>
                                            <TableCell>
                                                {problemNameMap.get(
                                                    p.apiProblemId,
                                                ) ??
                                                    `Problem #${p.apiProblemId}`}
                                            </TableCell>
                                            <TableCell>{p.maxPoints}</TableCell>
                                            <TableCell>{statusCell}</TableCell>
                                            <TableCell>
                                                {isEnrolled ? (
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Link
                                                            href={`/contest/${contestId}/problem/${p.label}`}
                                                        >
                                                            Attempt
                                                        </Link>
                                                    </Button>
                                                ) : (
                                                    <Lock className="text-muted-foreground h-4 w-4" />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}

                                {sortedProblems.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-muted-foreground py-8 text-center text-sm"
                                        >
                                            No problems available yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </section>

                {/* ── Footer actions ───────────────────────────────────────── */}
                <div className="flex justify-end">
                    <Button asChild variant="outline">
                        <Link href={`/contest/${contestId}/leaderboard`}>
                            View Leaderboard
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
