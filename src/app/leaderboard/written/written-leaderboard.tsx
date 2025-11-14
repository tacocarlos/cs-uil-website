"use client";

import { useState, useMemo, useEffect } from "react";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";

export default function WrittenLeaderboard() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCompetition, setSelectedCompetition] = useState<
        string | "all" | undefined
    >(undefined);
    const [selectedYear, setSelectedYear] = useState<
        number | "all" | undefined
    >(undefined);

    // Fetch available competitions and most recent competition
    const { data: competitions } =
        api.written.getAvailableCompetitions.useQuery();
    const { data: mostRecentCompetition } =
        api.written.getMostRecentCompetition.useQuery();

    // Fetch available years and most recent year
    const { data: years } = api.written.getAvailableYears.useQuery();
    const { data: mostRecentYear } = api.written.getMostRecentYear.useQuery();

    // Set default competition to most recent once loaded
    useEffect(() => {
        if (mostRecentCompetition && selectedCompetition === undefined) {
            setSelectedCompetition(mostRecentCompetition);
        }
    }, [mostRecentCompetition, selectedCompetition]);

    // Set default year to most recent once loaded
    useEffect(() => {
        if (mostRecentYear && selectedYear === undefined) {
            setSelectedYear(mostRecentYear);
        }
    }, [mostRecentYear, selectedYear]);

    // Determine the competition parameter for the query
    const competitionParam =
        selectedCompetition === "all" ? undefined : selectedCompetition;

    // Determine the year parameter for the query
    const yearParam = selectedYear === "all" ? undefined : selectedYear;

    // Fetch leaderboard data based on selected competition and year
    const { data: scores, isLoading } = api.written.getLeaderboard.useQuery(
        {
            competition: competitionParam as any,
            year: yearParam,
        },
        {
            enabled:
                selectedCompetition !== undefined && selectedYear !== undefined,
        },
    );

    // Filter by search term
    const filteredData = useMemo(() => {
        if (!scores) return [];
        return scores.filter((entry) =>
            entry.name.toLowerCase().includes(searchTerm.toLowerCase()),
        );
    }, [scores, searchTerm]);

    return (
        <div className="mx-auto w-full max-w-md rounded-xl bg-white p-4">
            <h2 className="mb-4 text-center text-2xl font-bold">
                Written Test Leaderboard
            </h2>

            <div className="mb-4 space-y-4">
                <div>
                    <label className="mb-2 block text-sm font-medium">
                        Year
                    </label>
                    <Select
                        value={selectedYear?.toString()}
                        onValueChange={(value) =>
                            setSelectedYear(
                                value === "all" ? "all" : parseInt(value),
                            )
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a year" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Years</SelectItem>
                            {years?.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium">
                        Competition
                    </label>
                    <Select
                        value={selectedCompetition}
                        onValueChange={setSelectedCompetition}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a competition" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                All Competitions
                            </SelectItem>
                            {competitions?.map((comp) => (
                                <SelectItem
                                    key={comp ?? "district"}
                                    value={comp ?? "district"}
                                >
                                    {comp}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

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
                    {isLoading ||
                    selectedCompetition === undefined ||
                    selectedYear === undefined ? (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                                Loading...
                            </TableCell>
                        </TableRow>
                    ) : filteredData.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                                No results found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredData.map((entry, index) => (
                            <TableRow key={entry.id}>
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
