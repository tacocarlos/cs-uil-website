"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowRight, Search, XCircle } from "lucide-react";
import { api } from "~/trpc/react";
import { Skeleton } from "~/components/ui/skeleton";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { useProblemProgress } from "~/components/resources/problem/use-problem-progress";
import {
    attemptedProblems,
    type AttemptedProblem,
    type AttemptSort,
} from "./attempted-problems";

/** Cards shown before "Show all", two rows on wide screens. */
const COLLAPSED_COUNT = 8;

function AttemptCard({ problem }: { problem: AttemptedProblem }) {
    const { problemId, name, submission } = problem;
    const submitted = new Date(submission.timeSubmitted);
    const percent =
        submission.maxPoints > 0
            ? (submission.points / submission.maxPoints) * 100
            : 0;

    return (
        <Link
            href={`/resources/past-problem/${problemId}`}
            className="group bg-card hover:border-primary/50 focus-visible:ring-ring/50 flex flex-col gap-3 rounded-lg border p-4 shadow-xs transition-colors outline-none focus-visible:ring-[3px]"
        >
            <div className="flex items-start justify-between gap-2">
                <h3 className="leading-snug font-semibold">{name}</h3>
                <Badge variant="outline" className="shrink-0">
                    Attempt {submission.attemptNumber}
                </Badge>
            </div>

            <div className="space-y-1">
                <div className="flex items-baseline justify-between text-sm">
                    <span className="text-destructive flex items-center gap-1 font-medium">
                        <XCircle className="h-3.5 w-3.5" />
                        Not accepted
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                        {submission.points} / {submission.maxPoints}
                    </span>
                </div>
                <Progress value={percent} className="h-1.5" />
            </div>

            <div className="text-muted-foreground mt-auto flex items-center justify-between text-xs">
                <time
                    dateTime={submitted.toISOString()}
                    title={format(submitted, "EEEE, MMM d, yyyy h:mm a")}
                >
                    {formatDistanceToNow(submitted, { addSuffix: true })}
                </time>
                <span className="text-foreground flex items-center gap-1 font-medium opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    Keep working
                    <ArrowRight className="h-3.5 w-3.5" />
                </span>
            </div>
        </Link>
    );
}

export default function InProgressProblems() {
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<AttemptSort>("newest");
    const [showAll, setShowAll] = useState(false);

    const { data: progress, isPending: progressPending } = useProblemProgress();
    const { data: problems, isPending: problemsPending } =
        api.problem.getMinimalProblems.useQuery(undefined, {
            staleTime: 60 * 60 * 1000,
        });

    const names = useMemo(
        () => new Map(problems?.map((p) => [p.id, p.name])),
        [problems],
    );
    const allAttempts = useMemo(
        () => (progress ? attemptedProblems(progress, names, { sort }) : []),
        [progress, names, sort],
    );
    const attempts = useMemo(
        () =>
            progress ? attemptedProblems(progress, names, { query, sort }) : [],
        [progress, names, query, sort],
    );

    const loading = progressPending || problemsPending;
    const visible = showAll ? attempts : attempts.slice(0, COLLAPSED_COUNT);

    return (
        <section className="space-y-4">
            <div className="mt-6 flex items-baseline gap-2">
                <h2 className="text-lg font-semibold">Attempted Problems</h2>
                {!loading && allAttempts.length > 0 && (
                    <span className="text-muted-foreground text-sm">
                        {allAttempts.length} not yet accepted
                    </span>
                )}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }, (_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                    ))}
                </div>
            ) : !progress ? (
                <p className="text-muted-foreground text-sm">
                    Couldn&apos;t load your attempts. Try refreshing the page.
                </p>
            ) : allAttempts.length === 0 ? (
                <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
                    <p>
                        No unsolved attempts. Every problem you&apos;ve
                        submitted has been accepted.
                    </p>
                    <Button asChild variant="link" className="mt-1">
                        <Link href="/resources/past-problem">
                            Find a new problem
                        </Link>
                    </Button>
                </div>
            ) : (
                <>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                type="search"
                                placeholder="Search by problem name..."
                                aria-label="Search attempted problems by name"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select
                            value={sort}
                            onValueChange={(v) => setSort(v as AttemptSort)}
                        >
                            <SelectTrigger
                                className="sm:w-56"
                                aria-label="Sort attempted problems"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">
                                    Latest submission first
                                </SelectItem>
                                <SelectItem value="oldest">
                                    Oldest submission first
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {attempts.length === 0 ? (
                        <p className="text-muted-foreground py-8 text-center text-sm">
                            No attempted problems match &ldquo;{query.trim()}
                            &rdquo;.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {visible.map((p) => (
                                <AttemptCard key={p.problemId} problem={p} />
                            ))}
                        </div>
                    )}

                    {attempts.length > COLLAPSED_COUNT && (
                        <div className="flex justify-center">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAll((s) => !s)}
                            >
                                {showAll
                                    ? "Show fewer"
                                    : `Show all ${attempts.length}`}
                            </Button>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
