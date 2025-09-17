"use client";

import { useState, useMemo } from "react";
import { Input } from "~/components/ui/input";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "~/components/ui/table";

type LeaderboardEntry = {
    name: string;
    score: number;
};
export default function Leaderboard({
    scores,
}: {
    scores: LeaderboardEntry[];
}) {
    const [searchTerm, setSearchTerm] = useState("");

    // Sort the data by totalScore in descending order and then filter by search term
    const filteredAndSortedData = useMemo(() => {
        const sorted = [...scores].sort((a, b) => b.score - a.score);
        return sorted.filter((entry) =>
            entry.name.toLowerCase().includes(searchTerm.toLowerCase()),
        );
    }, [scores, searchTerm]);

    return (
        <div className="mx-auto w-full max-w-md rounded-xl bg-white p-4">
            <h2 className="mb-4 text-center text-2xl font-bold">Leaderboard</h2>

            <div className="mb-4">
                <Input
                    type="text"
                    placeholder="Search by name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                />
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">Rank</TableHead>
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
                        filteredAndSortedData.map((entry, index) => (
                            <TableRow key={entry.name}>
                                <TableCell className="font-medium">
                                    {index + 1}
                                </TableCell>
                                <TableCell>{entry.name}</TableCell>
                                <TableCell className="text-right">
                                    {entry.score}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
