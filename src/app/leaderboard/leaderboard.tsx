"use client";

import { useState, useMemo } from "react";
import { LeaderboardPagination, usePagination } from "./pagination";
import { Input } from "~/components/ui/input";
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

type LeaderboardEntry = {
    id: string;
    name: string;
    score: number;
    /** The student's schools (only filled in on the shared leaderboard). */
    schools: string[];
};

type RankedEntry = LeaderboardEntry & { globalRank: number };

// ── Student dialog ────────────────────────────────────────────────────────────

/**
 * A student's stats (rank, score, ...) and, on the shared leaderboard,
 * their schools. Shared with the written leaderboard.
 */
export function StudentDialog({
    name,
    schools,
    stats,
    note,
    open,
    onOpenChange,
}: {
    name: string;
    /** Left out on a school's own leaderboard. */
    schools?: string[];
    /** Short values; tiles wrap onto more rows when there are many. */
    stats: readonly (readonly [label: string, value: string | number])[];
    /** A line below the stats, for details too long for a tile. */
    note?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{name}</DialogTitle>
                </DialogHeader>

                {schools && (
                    <p className="text-muted-foreground text-sm">
                        {schools.join(", ") || "No school"}
                    </p>
                )}
                <dl className="grid grid-cols-[repeat(auto-fit,minmax(5.5rem,1fr))] gap-2 text-center">
                    {stats.map(([label, value]) => (
                        <div key={label} className="rounded-md border py-2">
                            <dt className="text-muted-foreground text-xs">
                                {label}
                            </dt>
                            <dd className="text-lg font-bold">{value}</dd>
                        </div>
                    ))}
                </dl>
                {note && (
                    <p className="text-muted-foreground text-center text-sm">
                        {note}
                    </p>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ── Leaderboard table ─────────────────────────────────────────────────────────

export function rowClassName(rank: number) {
    // Medals for the top 3; a faint shared tint marks the rest of the
    // top 6 without looking like an award. Medal colors aren't theme
    // colors, so they're translucent to suit both light and dark mode.
    if (rank === 1) return "bg-yellow-400/40 hover:bg-yellow-400/25";
    if (rank === 2) return "bg-slate-400/40 hover:bg-slate-400/25";
    if (rank === 3) return "bg-orange-400/40 hover:bg-orange-400/25";
    if (rank <= 6) return "bg-info/10 hover:bg-info/5";
    return "";
}

export default function Leaderboard({
    scores,
    showSchools,
}: {
    scores: LeaderboardEntry[];
    /** Shared view: school search, and schools in the student dialog. */
    showSchools: boolean;
}) {
    const [searchTerm, setSearchTerm] = useState("");
    // Kept after closing so the dialog keeps its content while it animates
    // out.
    const [selectedEntry, setSelectedEntry] = useState<RankedEntry | null>(
        null,
    );
    const [dialogOpen, setDialogOpen] = useState(false);

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
    const pagination = usePagination(filteredAndSortedData);

    return (
        <div className="bg-card text-card-foreground mx-auto w-full max-w-2xl rounded-xl border p-4 shadow-sm">
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
                        <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredAndSortedData.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
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
                                {/* Wraps, so long names fit in portrait */}
                                <TableCell className="whitespace-normal">
                                    <button
                                        className="hover:text-info py-1 text-left underline-offset-4 hover:underline"
                                        onClick={() => {
                                            setSelectedEntry(entry);
                                            setDialogOpen(true);
                                        }}
                                    >
                                        {entry.name}
                                    </button>
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

            {selectedEntry && (
                <StudentDialog
                    name={selectedEntry.name}
                    schools={showSchools ? selectedEntry.schools : undefined}
                    stats={[
                        ["Rank", selectedEntry.globalRank],
                        ["Score", selectedEntry.score],
                    ]}
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                />
            )}
        </div>
    );
}
