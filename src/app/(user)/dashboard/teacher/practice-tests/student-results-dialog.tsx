"use client";

import { Badge } from "~/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import { Skeleton } from "~/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
    COMPETITION_LEVEL_LABELS,
    COMPETITION_LEVELS,
} from "~/lib/problems/competition-levels";
import {
    formatPracticeTime,
    isLtiUid,
    uilMaxScore,
    uilScore,
} from "~/lib/prairielearn/practice-tests";
import { api, type RouterOutputs } from "~/trpc/react";

export type StudentResultsTarget = { userId: string; name: string };

type Attempt = RouterOutputs["prairielearn"]["getStudentResults"][number];

const ALL = "all";

/** "All", then a tab per contest level ("Custom" has no practice test). */
const TABS = [
    { value: ALL, label: "All" },
    ...COMPETITION_LEVELS.filter((level) => level !== "custom").map(
        (level) => ({
            value: level,
            label: COMPETITION_LEVEL_LABELS[level],
        }),
    ),
];

/**
 * The attempts a tab shows. A practice test's level comes from its title in
 * PrairieLearn ("District Practice Test"), so it's matched loosely.
 */
function attemptsFor(attempts: Attempt[], tab: (typeof TABS)[number]) {
    if (tab.value === ALL) return attempts;
    const label = tab.label.toLowerCase();
    return attempts.filter((a) => a.level.trim().toLowerCase() === label);
}

/**
 * Every practice test attempt by one student, newest first, across all the
 * PrairieLearn users linked to their account, with a tab per contest level.
 */
export function StudentResultsDialog({
    student,
    open,
    onOpenChange,
}: {
    student: StudentResultsTarget | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const {
        data: attempts,
        isPending,
        error,
    } = api.prairielearn.getStudentResults.useQuery(
        { userId: student?.userId ?? "" },
        { enabled: student !== null },
    );
    // Only worth saying which PrairieLearn user took it when there are two.
    const multipleUids = new Set(attempts?.map((a) => a.uid)).size > 1;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{student?.name} — practice tests</DialogTitle>
                    <DialogDescription>
                        Every attempt, newest first. Scores are UIL points: +6
                        right, −2 wrong, 0 skipped.
                    </DialogDescription>
                </DialogHeader>
                {isPending ? (
                    <Skeleton className="h-24 w-full" />
                ) : error ? (
                    <p className="text-destructive text-sm">{error.message}</p>
                ) : (
                    // The dialog unmounts its content when closed, so this
                    // starts on "All" every time it opens.
                    <Tabs
                        defaultValue={ALL}
                        className="gap-0 overflow-hidden rounded-lg border"
                    >
                        {/* The tabs are the table's top edge; w-max keeps
                            them scrollable, not clipped, when narrow. */}
                        <div className="bg-muted/50 overflow-x-auto border-b">
                            <TabsList className="h-auto w-max min-w-full justify-center rounded-none bg-transparent p-0">
                                {TABS.map((tab) => (
                                    <TabsTrigger
                                        key={tab.value}
                                        value={tab.value}
                                        className="data-[state=active]:border-primary dark:data-[state=active]:border-primary text-muted-foreground data-[state=active]:text-foreground flex-none rounded-none border-0 border-b-2 border-transparent px-3 py-2.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:bg-transparent"
                                    >
                                        {tab.label}
                                        <span className="text-muted-foreground tabular-nums">
                                            {attemptsFor(attempts, tab).length}
                                        </span>
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>
                        {TABS.map((tab) => (
                            <TabsContent
                                key={tab.value}
                                value={tab.value}
                                className="px-2"
                            >
                                <AttemptsTable
                                    attempts={attemptsFor(attempts, tab)}
                                    showUid={multipleUids}
                                />
                            </TabsContent>
                        ))}
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
}

function AttemptsTable({
    attempts,
    showUid,
}: {
    attempts: Attempt[];
    /** Whether to say which PrairieLearn user took each attempt. */
    showUid: boolean;
}) {
    if (attempts.length === 0) {
        return (
            <p className="text-muted-foreground py-8 text-center text-sm">
                No attempts yet.
            </p>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead className="text-right">
                        Right / wrong / skipped
                    </TableHead>
                    <TableHead className="text-right">Score</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {attempts.map((a) => {
                    const tally =
                        a.correct !== null &&
                        a.wrong !== null &&
                        a.skipped !== null
                            ? {
                                  correct: a.correct,
                                  wrong: a.wrong,
                                  skipped: a.skipped,
                              }
                            : null;
                    return (
                        <TableRow key={a.assessmentInstanceId}>
                            <TableCell className="whitespace-normal">
                                <div className="font-medium">{a.level}</div>
                                {showUid && (
                                    <div className="text-muted-foreground text-xs break-all">
                                        {isLtiUid(a.uid)
                                            ? "Through the LMS"
                                            : a.uid}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>
                                {formatPracticeTime(a.startedAt)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                                {tally
                                    ? `${tally.correct} / ${tally.wrong} / ${tally.skipped}`
                                    : "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                                {a.open ? (
                                    <Badge variant="secondary">
                                        In progress
                                    </Badge>
                                ) : tally ? (
                                    <>
                                        <span className="font-medium">
                                            {uilScore(tally)}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {" "}
                                            / {uilMaxScore(tally)}
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-muted-foreground">
                                        Not scored yet
                                    </span>
                                )}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}
