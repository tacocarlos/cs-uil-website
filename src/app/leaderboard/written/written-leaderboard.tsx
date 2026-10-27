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
import { rowClassName } from "../leaderboard";
import { LeaderboardPagination, usePagination } from "../pagination";

type WrittenLeaderboardEntry = {
    id: string;
    name: string;
    score: number;
    /** The student's schools (only filled in on the shared leaderboard). */
    schools: string[];
};

/** Students ranked by their total written test score. */
export default function WrittenLeaderboard({
    scores,
    showSchools,
}: {
    scores: WrittenLeaderboardEntry[];
    /** Adds a School column (and school search), for the shared view. */
    showSchools: boolean;
}) {
    const [searchTerm, setSearchTerm] = useState("");

    // Rank before filtering, so ranks and medals don't change while
    // searching.
    const filteredData = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return [...scores]
            .sort((a, b) => b.score - a.score)
            .map((entry, idx) => ({ ...entry, rank: idx + 1 }))
            .filter(
                (entry) =>
                    entry.name.toLowerCase().includes(term) ||
                    entry.schools.some((s) => s.toLowerCase().includes(term)),
            );
    }, [scores, searchTerm]);
    const columns = showSchools ? 4 : 3;
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
                        {showSchools && <TableHead>School</TableHead>}
                        <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={columns}
                                className="h-24 text-center"
                            >
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
                                <TableCell>{entry.name}</TableCell>
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
        </div>
    );
}
