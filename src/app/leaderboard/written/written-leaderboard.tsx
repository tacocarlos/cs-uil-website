"use client";

import { useMemo, useState } from "react";
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
    compareWrittenTotals,
    formatAccuracy,
} from "~/lib/written/leaderboard";
import { rowClassName, StudentDialog } from "../leaderboard";
import { LeaderboardPagination, usePagination } from "../pagination";

type WrittenLeaderboardEntry = {
    id: string;
    name: string;
    score: number;
    /** Average accuracy, which breaks score ties. */
    accuracy: number;
    /** The student's schools (only filled in on the shared leaderboard). */
    schools: string[];
};

/** Students ranked by their total written test score. */
export default function WrittenLeaderboard({
    scores,
    showSchools,
}: {
    scores: WrittenLeaderboardEntry[];
    /** Shared view: school search, and schools in the student dialog. */
    showSchools: boolean;
}) {
    const [searchTerm, setSearchTerm] = useState("");
    // Kept after closing so the dialog keeps its content while it animates
    // out.
    const [selectedEntry, setSelectedEntry] = useState<
        (WrittenLeaderboardEntry & { rank: number }) | null
    >(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Rank before filtering, so ranks and medals don't change while
    // searching.
    const filteredData = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return [...scores]
            .sort(compareWrittenTotals)
            .map((entry, idx) => ({ ...entry, rank: idx + 1 }))
            .filter(
                (entry) =>
                    entry.name.toLowerCase().includes(term) ||
                    entry.schools.some((s) => s.toLowerCase().includes(term)),
            );
    }, [scores, searchTerm]);
    const pagination = usePagination(filteredData);

    return (
        <div className="mx-auto w-full max-w-2xl rounded-xl bg-white p-4">
            <h2 className="mb-4 text-center text-2xl font-bold">
                Written Leaderboard
            </h2>

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
                        <TableHead>Student</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                                {scores.length === 0
                                    ? "No scores yet."
                                    : "No results found."}
                            </TableCell>
                        </TableRow>
                    ) : (
                        pagination.pageItems.map((entry) => (
                            <TableRow
                                key={entry.id}
                                className={`text-[1rem] font-medium ${rowClassName(entry.rank)}`}
                            >
                                <TableCell className="font-medium">
                                    {entry.rank}
                                </TableCell>
                                {/* Wraps, so long names fit in portrait */}
                                <TableCell className="whitespace-normal">
                                    <button
                                        className="hover:text-primary py-1 text-left underline-offset-4 hover:underline"
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
                        ["Rank", selectedEntry.rank],
                        ["Score", selectedEntry.score],
                        ["Accuracy", formatAccuracy(selectedEntry.accuracy)],
                    ]}
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                />
            )}
        </div>
    );
}
