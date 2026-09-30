"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { LeaderboardPagination, usePagination } from "./pagination";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "~/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import type { CompetitionLevel } from "~/lib/api/lunaghs";

type LeaderboardEntry = {
    id: string;
    name: string;
    score: number;
    solvedProblemIds: number[];
    /** The student's schools (only filled in on the shared leaderboard). */
    schools: string[];
};

export type ProblemLeaderboardData = {
    id: number;
    competition_id: number;
    name: string;
};

export type CompetitionLeaderboardData = {
    id: number;
    level: CompetitionLevel;
    year: number;
};

// ── Solved-problems dialog ────────────────────────────────────────────────────
function CompetitionBadge({
    competition,
}: {
    competition?: CompetitionLeaderboardData;
}) {
    if (competition === undefined) {
        return "UC2067 ";
    }

    let ident = competition.level.at(0)!.toUpperCase();
    if (ident === "I") {
        ident = competition.level
            .at(competition.level.length - 1)!
            .toUpperCase();
    }

    return (
        <span>
            {ident}
            {competition.year}
        </span>
    );
}

function SolvedProblemsDialog({
    entry,
    problems,
    open,
    onOpenChange,
    competitions,
}: {
    entry: LeaderboardEntry;
    problems: ProblemLeaderboardData[];
    competitions: Map<number, CompetitionLeaderboardData>;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const solved = useMemo(() => {
        const idSet = new Set();
        entry.solvedProblemIds.forEach((pid) => idSet.add(pid));
        console.dir(idSet);
        return problems
            .filter((p) => {
                console.dir(`checking: ${p.id}`);
                return idSet.has(p.id);
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [entry.solvedProblemIds, problems]);

    console.dir(competitions);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[70vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {entry.name}&apos;s completed problems
                    </DialogTitle>
                </DialogHeader>

                {solved.length === 0 ? (
                    <p className="text-muted-foreground py-4 text-center text-sm">
                        No completed problems.
                    </p>
                ) : (
                    <ul className="space-y-2 pt-2">
                        {solved.map((problem) => (
                            <li
                                key={problem.id}
                                className="flex items-center justify-between gap-4 rounded-md border px-3 py-2"
                            >
                                <span className="flex items-center gap-2 text-sm font-medium">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                                    <CompetitionBadge
                                        competition={competitions.get(
                                            problem.competition_id,
                                        )}
                                    />
                                    {problem.name}
                                </span>
                                <Button
                                    asChild
                                    size="sm"
                                    variant="outline"
                                    className="shrink-0"
                                >
                                    <Link
                                        href={`/resources/past-problem/${problem.id}`}
                                    >
                                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                        View
                                    </Link>
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ── Leaderboard table ─────────────────────────────────────────────────────────

export default function Leaderboard({
    scores,
    problems,
    competitions,
    showSchools,
}: {
    scores: LeaderboardEntry[];
    problems: ProblemLeaderboardData[];
    competitions: Map<number, CompetitionLeaderboardData>;
    /** Adds a School column (and school search), for the shared view. */
    showSchools: boolean;
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(
        null,
    );

    const filteredAndSortedData = useMemo(() => {
        const sorted = [...scores].sort((a, b) => b.score - a.score);
        // Assign global rank before filtering so medal colours stay correct
        // when the search term hides some entries.
        const term = searchTerm.toLowerCase();
        return sorted
            .map((entry, idx) => ({ ...entry, globalRank: idx + 1 }))
            .filter(
                (entry) =>
                    entry.name.toLowerCase().includes(term) ||
                    entry.schools.some((s) => s.toLowerCase().includes(term)),
            );
    }, [scores, searchTerm]);
    const columns = showSchools ? 4 : 3;
    const pagination = usePagination(filteredAndSortedData);

    function rowClassName(rank: number) {
        // Medals for the top 3; a faint shared tint marks the rest of the
        // top 6 without looking like an award.
        if (rank === 1) return "bg-yellow-400 hover:bg-yellow-200";
        if (rank === 2) return "bg-slate-400 hover:bg-slate-200";
        if (rank === 3) return "bg-orange-400 hover:bg-orange-200";
        if (rank <= 6) return "bg-sky-100 hover:bg-sky-50";
        return "";
    }

    return (
        <div className="mx-auto w-full max-w-2xl rounded-xl bg-white p-4">
            <h2 className="mb-4 text-center text-2xl font-bold">Leaderboard</h2>

            <div className="mb-4">
                <Input
                    type="text"
                    placeholder={
                        showSchools
                            ? "Search by name or school"
                            : "Search by name"
                    }
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
                        <TableHead>Username</TableHead>
                        {showSchools && <TableHead>School</TableHead>}
                        <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredAndSortedData.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={columns}
                                className="h-24 text-center"
                            >
                                No results found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        pagination.pageItems.map((entry) => (
                            <TableRow
                                key={entry.id}
                                className={`text-[1rem] font-medium ${rowClassName(entry.globalRank)}`}
                            >
                                <TableCell className="font-medium">
                                    {entry.globalRank}
                                </TableCell>
                                <TableCell>
                                    <button
                                        className="hover:text-primary text-left underline-offset-4 hover:underline"
                                        onClick={() => setSelectedEntry(entry)}
                                    >
                                        {entry.name}
                                    </button>
                                </TableCell>
                                {showSchools && (
                                    <TableCell className="text-sm">
                                        {entry.schools.join(", ") || "—"}
                                    </TableCell>
                                )}
                                <TableCell className="text-right">
                                    {entry.score}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            <LeaderboardPagination pagination={pagination} />

            {selectedEntry && (
                <SolvedProblemsDialog
                    entry={selectedEntry}
                    competitions={competitions}
                    problems={problems}
                    open={selectedEntry !== null}
                    onOpenChange={(open) => {
                        if (!open) setSelectedEntry(null);
                    }}
                />
            )}
        </div>
    );
}
