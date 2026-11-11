"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import { rowClassName, StudentDialog } from "../leaderboard";
import { LeaderboardPagination, usePagination } from "../pagination";

export type PracticeLeaderboardEntry = {
    userId: string;
    name: string;
    rank: number;
    /** UIL score of the best attempt: +6 right, −2 wrong, 0 blank. */
    score: number;
    maxScore: number;
    correct: number;
    wrong: number;
    skipped: number;
    /** When the best attempt was started, formatted for display. */
    achievedOn: string;
    attempts: number;
    /** Hid their scores from other students (only teachers see them). */
    hidden: boolean;
};

/** The school's students ranked by best score on one practice test. */
export default function PracticeLeaderboard({
    level,
    scores,
    updated,
    syncError,
    manageHref,
}: {
    /** The practice test's level; null when the course has none. */
    level: string | null;
    scores: PracticeLeaderboardEntry[];
    /** When results were last copied from PrairieLearn, formatted. */
    updated: string | null;
    /** Why the last copy failed (shown to teachers only). */
    syncError: string | null;
    /** Where teachers link PrairieLearn users (null for students). */
    manageHref: string | null;
}) {
    const [searchTerm, setSearchTerm] = useState("");
    // Kept after closing so the dialog keeps its content while it animates
    // out.
    const [selected, setSelected] = useState<PracticeLeaderboardEntry | null>(
        null,
    );
    const [dialogOpen, setDialogOpen] = useState(false);

    const filtered = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return scores.filter((s) => s.name.toLowerCase().includes(term));
    }, [scores, searchTerm]);
    const pagination = usePagination(filtered);

    return (
        <div className="bg-card text-card-foreground mx-auto w-full max-w-2xl rounded-xl border p-4 shadow-sm">
            <h2 className="mb-1 text-center text-2xl font-bold">
                {level ? `${level} Practice Test` : "Practice Tests"}
            </h2>
            <p className="text-muted-foreground mb-4 text-center text-sm">
                Best score on PrairieLearn, scored like UIL: +6 right, −2 wrong,
                0 blank
                {updated && ` · updated ${updated}`}
            </p>

            {syncError && (
                <div className="border-destructive/30 bg-destructive/10 text-destructive mb-4 rounded-md border p-3 text-sm">
                    Couldn&apos;t get the latest results: {syncError}
                </div>
            )}

            <div className="mb-4">
                <Input
                    type="text"
                    placeholder="Search by name"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        pagination.setPage(0);
                    }}
                    className="w-full"
                />
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-12.5">Rank</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead className="text-right">Attempts</TableHead>
                        <TableHead className="text-right">Best</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filtered.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                {level === null
                                    ? "No practice tests found in PrairieLearn yet."
                                    : scores.length === 0
                                      ? "No finished attempts yet."
                                      : "No results found."}
                            </TableCell>
                        </TableRow>
                    ) : (
                        pagination.pageItems.map((entry) => (
                            <TableRow
                                key={entry.userId}
                                className={`text-[1rem] font-medium ${rowClassName(entry.rank)}`}
                            >
                                <TableCell className="font-medium">
                                    {entry.rank}
                                </TableCell>
                                <TableCell className="whitespace-normal">
                                    <button
                                        className="hover:text-info py-1 text-left underline-offset-4 hover:underline"
                                        onClick={() => {
                                            setSelected(entry);
                                            setDialogOpen(true);
                                        }}
                                    >
                                        {entry.name}
                                    </button>
                                    {entry.hidden && (
                                        <Badge
                                            variant="outline"
                                            className="ml-2"
                                            title="This student hid their scores, so only teachers see them here."
                                        >
                                            Hidden
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-right">
                                    {entry.attempts}
                                </TableCell>
                                <TableCell className="text-right">
                                    {entry.score}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            <LeaderboardPagination pagination={pagination} />

            {manageHref && (
                <p className="text-muted-foreground mt-4 text-center text-sm">
                    Only students linked to a site account are ranked.{" "}
                    <Link
                        href={manageHref}
                        className="text-info underline-offset-4 hover:underline"
                    >
                        Link PrairieLearn students
                    </Link>
                </p>
            )}

            {selected && (
                <StudentDialog
                    name={selected.name}
                    // Three per row: the best attempt's standing, then its
                    // answers (scored +6, -2, 0).
                    stats={[
                        ["Rank", selected.rank],
                        [
                            "Best score",
                            `${selected.score} / ${selected.maxScore}`,
                        ],
                        ["Attempts", selected.attempts],
                        ["Right", selected.correct],
                        ["Wrong", selected.wrong],
                        ["Blank", selected.skipped],
                    ]}
                    note={`Best attempt taken ${selected.achievedOn}`}
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                />
            )}
        </div>
    );
}
