"use client";

/**
 * Teacher contest management page.
 *
 * Each section is its own component. Sections showing live data subscribe
 * to one RefreshController owned by the page, so they all refetch together
 * on the same tick instead of drifting apart on separate timers.
 * `export const dynamic = "force-dynamic"` prevents static caching.
 */

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow, isPast } from "date-fns";
import { ArrowLeft, BookOpen, Clock, Edit, Users } from "lucide-react";
import { toast } from "sonner";
import { api, type RouterOutputs } from "~/trpc/react";
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
import { STATUS_TRANSITIONS, type ContestStatus } from "~/lib/contest/status";
import {
    type RefreshController,
    useRefreshController,
    useRefreshSubscription,
} from "~/hooks/use-refresh-controller";
import { LeaderboardPreview } from "./leaderboard-preview";
import { RecentContestSubmissions } from "./recent-submissions";

type Contest = NonNullable<RouterOutputs["contest"]["getById"]>;

/** How often the live sections refresh. */
const REFRESH_MS = 5000;

/** Statuses during which nothing on the page changes, so polling stops. */
const STATIC_STATUSES: readonly ContestStatus[] = ["draft", "ended"];

// ─── Header ───────────────────────────────────────────────────────────────────

/** The button that moves a contest to each status (see STATUS_TRANSITIONS). */
const STATUS_ACTIONS: Record<
    Exclude<ContestStatus, "draft">,
    { label: string; variant: "default" | "outline" | "destructive" }
> = {
    scheduled: { label: "Publish", variant: "default" },
    active: { label: "Start Now", variant: "default" },
    frozen: { label: "Freeze Leaderboard", variant: "outline" },
    ended: { label: "End Contest", variant: "destructive" },
};

function ContestControls({
    contestId,
    status,
    refresh,
}: {
    contestId: number;
    status: ContestStatus;
    refresh: RefreshController;
}) {
    const setStatus = api.contest.setStatus.useMutation({
        onSuccess: () => {
            toast.success("Contest status updated.");
            // Update every live section now rather than on the next tick.
            void refresh.refreshNow();
        },
        onError: (err) => toast.error(err.message),
    });

    const mutate = (next: ContestStatus) =>
        setStatus.mutate({ contestId, status: next });

    return (
        <div className="flex flex-wrap items-center gap-2">
            {STATUS_TRANSITIONS[status].map((next) => (
                <Button
                    key={next}
                    variant={STATUS_ACTIONS[next].variant}
                    onClick={() => mutate(next)}
                    disabled={setStatus.isPending}
                >
                    {STATUS_ACTIONS[next].label}
                </Button>
            ))}

            <Button asChild variant="ghost" size="sm">
                <Link href={`/dashboard/teacher/contests/${contestId}/edit`}>
                    <Edit className="mr-1 h-4 w-4" />
                    Edit
                </Link>
            </Button>
        </div>
    );
}

function ContestHeader({
    contest,
    refresh,
}: {
    contest: Contest;
    refresh: RefreshController;
}) {
    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
                <Button asChild variant="ghost" size="sm">
                    <Link href="/dashboard/teacher/contests">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">{contest.name}</h1>
                <ContestStatusBadge status={contest.status} />
                <span className="text-muted-foreground text-sm">
                    {contest.hostSchool ?? "Global contest"}
                </span>
            </div>

            {/* Status changes and editing are for those who manage the
                contest; other teachers follow their own students here. */}
            {contest.canManage ? (
                <ContestControls
                    contestId={contest.id}
                    status={contest.status}
                    refresh={refresh}
                />
            ) : (
                <p className="text-muted-foreground text-sm">
                    Showing your school&apos;s students&apos; submissions.
                </p>
            )}
        </div>
    );
}

// ─── Stats row ────────────────────────────────────────────────────────────────

function StatCard({
    title,
    icon: Icon,
    value,
}: {
    title: string;
    icon: typeof Clock;
    value: React.ReactNode;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{value}</p>
            </CardContent>
        </Card>
    );
}

function ContestStats({
    contest,
    refresh,
}: {
    contest: Contest;
    refresh: RefreshController;
}) {
    // The time remaining depends on the clock, not just on the data, so
    // re-render on every tick even when the contest itself is unchanged.
    const [, setNow] = useState(Date.now);
    useRefreshSubscription(refresh, () => setNow(Date.now()));

    const timeLabel = isPast(contest.endsAt)
        ? "Ended"
        : formatDistanceToNow(contest.endsAt, { addSuffix: true });

    return (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
                title="Problems"
                icon={BookOpen}
                value={contest.problems.length}
            />
            <StatCard
                title="Participants"
                icon={Users}
                value={contest.participantCount}
            />
            <StatCard title="Time Remaining" icon={Clock} value={timeLabel} />
        </div>
    );
}

// ─── Problems list ────────────────────────────────────────────────────────────

function ContestProblems({ problems }: { problems: Contest["problems"] }) {
    const sortedProblems = [...problems].sort(
        (a, b) => a.displayOrder - b.displayOrder,
    );

    return (
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
                                    <TableCell>{p.apiProblemId}</TableCell>
                                    <TableCell>{p.maxPoints}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </section>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeacherContestPage() {
    const { contestId: contestIdStr } = useParams<{ contestId: string }>();
    const contestId = parseInt(contestIdStr, 10);

    const {
        data: contest,
        isLoading: contestLoading,
        refetch: refetchContest,
    } = api.contest.getById.useQuery(
        { contestId },
        { enabled: !isNaN(contestId) },
    );

    // One controller drives every live section. The contest itself is
    // refetched too, since its status and participant count change while
    // it runs (and it can start or end on its own).
    const refresh = useRefreshController({
        intervalMs: REFRESH_MS,
        enabled: !!contest && !STATIC_STATUSES.includes(contest.status),
    });
    useRefreshSubscription(refresh, refetchContest);

    if (contestLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center pt-20">
                <p className="text-muted-foreground text-sm">Loading…</p>
            </div>
        );
    }

    if (!contest) {
        return (
            <div className="min-h-screen px-4 pt-20 pb-8 sm:px-8">
                <p className="text-destructive mt-8 text-center">
                    Contest not found.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen px-4 pt-20 pb-8 sm:px-8">
            <div className="mx-auto max-w-6xl">
                <ContestHeader contest={contest} refresh={refresh} />
                <ContestStats contest={contest} refresh={refresh} />
                <ContestProblems problems={contest.problems} />
                <RecentContestSubmissions
                    contestId={contestId}
                    problems={contest.problems}
                    refresh={refresh}
                />
                <LeaderboardPreview contestId={contestId} refresh={refresh} />
            </div>
        </div>
    );
}
