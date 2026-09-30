import { auth } from "auth";
import { headers } from "next/headers";
import Link from "next/link";
import { format, formatDistanceToNow, isPast, isFuture } from "date-fns";
import { eq } from "drizzle-orm";
import {
    CheckCircle2,
    Clock,
    Trophy,
    Users,
    BookOpen,
    ChevronRight,
    School,
} from "lucide-react";
import { VISIBILITY_LABELS } from "~/lib/contest/visibility";
import { api } from "~/trpc/server";
import type { RouterOutputs } from "~/trpc/react";
import { db } from "~/server/db";
import { contestEnrollment } from "~/server/db/schema/contest";
import { ContestStatusBadge } from "~/components/contest/contest-status-badge";
import { Button } from "~/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";

export const dynamic = "force-dynamic";

// ── Types ─────────────────────────────────────────────────────────────────────

type ContestRow = RouterOutputs["contest"]["getAll"][number];

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeLabel(contest: ContestRow): string {
    if (isPast(contest.endsAt)) {
        return `Ended ${formatDistanceToNow(contest.endsAt, { addSuffix: true })}`;
    }
    if (isFuture(contest.startsAt)) {
        return `Starts ${formatDistanceToNow(contest.startsAt, { addSuffix: true })}`;
    }
    return `Ends ${formatDistanceToNow(contest.endsAt, { addSuffix: true })}`;
}

// ── Contest card ──────────────────────────────────────────────────────────────

function ContestCard({
    contest,
    enrolled,
}: {
    contest: ContestRow;
    enrolled: boolean;
}) {
    const status = contest.status;
    const isEnded = status === "ended";

    return (
        <Card className="flex flex-col transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <ContestStatusBadge
                        status={status}
                        friendly
                        className="shrink-0 text-xs"
                    />
                    {enrolled && (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Enrolled
                        </span>
                    )}
                </div>
                <CardTitle className="mt-1 text-base leading-snug">
                    {contest.name}
                </CardTitle>
                {contest.description && (
                    <p className="text-muted-foreground line-clamp-2 text-xs">
                        {contest.description}
                    </p>
                )}
            </CardHeader>

            <CardContent className="flex-1 pb-2">
                {/* Metadata */}
                <div className="text-muted-foreground space-y-1.5 text-xs">
                    <span className="flex items-center gap-1.5">
                        <School className="h-3.5 w-3.5" />
                        {contest.hostSchool}
                        {contest.visibility !== "school" &&
                            ` · ${VISIBILITY_LABELS[contest.visibility].label}`}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" />
                        {contest.problemCount} problem
                        {contest.problemCount !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {contest.participantCount} participant
                        {contest.participantCount !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {timeLabel(contest)}
                    </span>
                </div>

                {/* Date range */}
                <p className="text-muted-foreground mt-3 text-xs">
                    {format(contest.startsAt, "MMM d")}
                    {" – "}
                    {format(contest.endsAt, "MMM d, yyyy")}
                </p>
            </CardContent>

            <CardFooter className="pt-2">
                <Button
                    asChild
                    size="sm"
                    className="w-full"
                    variant={isEnded ? "outline" : "default"}
                >
                    <Link href={`/contest/${contest.id}`}>
                        {isEnded
                            ? "View Results"
                            : enrolled
                              ? "Go to Contest"
                              : "View Contest"}
                        <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

// ── Section ───────────────────────────────────────────────────────────────────

function Section({
    title,
    icon: Icon,
    contests,
    enrolledIds,
    emptyMessage,
    compact = false,
}: {
    title: string;
    icon: React.ElementType;
    contests: ContestRow[];
    enrolledIds: Set<number>;
    emptyMessage: string;
    compact?: boolean;
}) {
    if (contests.length === 0) {
        return (
            <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                    <Icon className="h-5 w-5" />
                    {title}
                </h2>
                <p className="text-muted-foreground text-sm">{emptyMessage}</p>
            </section>
        );
    }

    return (
        <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Icon className="h-5 w-5" />
                {title}
                <span className="text-muted-foreground text-sm font-normal">
                    ({contests.length})
                </span>
            </h2>
            {compact ? (
                // Compact list for ended contests
                <div className="text-foreground divide-y rounded-lg border bg-white">
                    {contests.map((c) => (
                        <Link
                            key={c.id}
                            href={`/contest/${c.id}`}
                            className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50"
                        >
                            <span className="font-medium">{c.name}</span>
                            <span className="text-muted-foreground flex items-center gap-3">
                                <span>{c.hostSchool}</span>
                                <span>{c.problemCount} problems</span>
                                <span>{format(c.endsAt, "MMM d, yyyy")}</span>
                                <ChevronRight className="h-4 w-4" />
                            </span>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {contests.map((c) => (
                        <ContestCard
                            key={c.id}
                            contest={c}
                            enrolled={enrolledIds.has(c.id)}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function StudentContestsPage() {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    const userId = session!.user.id; // layout guarantees auth

    // Fetch contests and this student's enrollments in parallel
    const [allContests, myEnrollments] = await Promise.all([
        api.contest.getAll(),
        db
            .select({ contestId: contestEnrollment.contestId })
            .from(contestEnrollment)
            .where(eq(contestEnrollment.userId, userId)),
    ]);

    const enrolledIds = new Set(myEnrollments.map((e) => e.contestId));

    // Students never see draft contests
    const visible = allContests.filter((c) => c.status !== "draft");

    const active = visible.filter(
        (c) => c.status === "active" || c.status === "frozen",
    );
    const upcoming = visible.filter((c) => c.status === "scheduled");
    const ended = visible.filter((c) => c.status === "ended");

    const myEnrolledActive = active.filter((c) => enrolledIds.has(c.id));
    const notEnrolledActive = active.filter((c) => !enrolledIds.has(c.id));

    return (
        <div className="bg-primary min-h-screen pt-20">
            <div className="text-primary-foreground mx-auto max-w-5xl px-6 pb-16">
                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold">Contests</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Join a contest, solve problems, and climb the
                        leaderboard.
                    </p>
                </div>

                <div className="space-y-12">
                    {/* ── My active contests ──────────────────────────────── */}
                    {myEnrolledActive.length > 0 && (
                        <Section
                            title="In Progress"
                            icon={Trophy}
                            contests={myEnrolledActive}
                            enrolledIds={enrolledIds}
                            emptyMessage=""
                        />
                    )}

                    {/* ── Open contests to join ───────────────────────────── */}
                    <Section
                        title="Active Now"
                        icon={CheckCircle2}
                        contests={notEnrolledActive}
                        enrolledIds={enrolledIds}
                        emptyMessage="No contests are running right now. Check back soon."
                    />

                    {/* ── Upcoming ────────────────────────────────────────── */}
                    <Section
                        title="Upcoming"
                        icon={Clock}
                        contests={upcoming}
                        enrolledIds={enrolledIds}
                        emptyMessage="No contests are scheduled yet."
                    />

                    {/* ── Past ────────────────────────────────────────────── */}
                    {ended.length > 0 && (
                        <Section
                            title="Past Contests"
                            icon={BookOpen}
                            contests={ended}
                            enrolledIds={enrolledIds}
                            emptyMessage=""
                            compact
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
