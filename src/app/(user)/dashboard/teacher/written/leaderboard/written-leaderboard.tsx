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
import {
    LeaderboardPagination,
    usePagination,
} from "~/app/leaderboard/pagination";
import { api } from "~/trpc/react";
import { FormerBadge, IncludeFormerCheckbox } from "../former";

function getCurrentYear() {
    return 2027;
}

function getYearParam(
    yearParam: "all" | "current" | number | string | undefined,
): number | undefined {
    if (yearParam === "current") return getCurrentYear();
    else if (yearParam === "all" || yearParam === undefined) return undefined;
    else if (typeof yearParam === "number") return yearParam;
    else return parseInt(yearParam);
}

/** The teacher's students ranked by written test score. */
export default function WrittenLeaderboard() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCompetition, setSelectedCompetition] = useState<
        string | "all" | undefined
    >(undefined);
    const [selectedYear, setSelectedYear] = useState<
        number | string | "all" | "current" | undefined
    >("current");
    const [includeFormer, setIncludeFormer] = useState(false);

    // Fetch available years (not year-dependent)
    const { data: years } = api.written.getAvailableYears.useQuery();

    // Determine year parameter before using it in dependent queries
    const yearParam = getYearParam(selectedYear);

    // Competitions and most-recent-competition are scoped to the selected year
    const { data: competitions } =
        api.written.getAvailableCompetitions.useQuery({
            year: yearParam,
            includeFormer,
        });
    const { data: mostRecentCompetition, isSuccess: mostRecentLoaded } =
        api.written.getMostRecentCompetition.useQuery({
            year: yearParam,
            includeFormer,
        });

    // When the year changes, reset the competition so the year-scoped
    // mostRecentCompetition effect below can set the correct default.
    useEffect(() => {
        setSelectedCompetition(undefined);
    }, [selectedYear]);

    // Once the (year-scoped) most-recent competition loads, apply it as
    // default; with no scores yet, show all competitions.
    useEffect(() => {
        if (selectedCompetition === undefined && mostRecentLoaded) {
            setSelectedCompetition(mostRecentCompetition ?? "all");
        }
    }, [mostRecentCompetition, mostRecentLoaded, selectedCompetition]);

    // Determine the competition parameter for the query
    const competitionParam =
        selectedCompetition === "all" ? undefined : selectedCompetition;

    // Fetch leaderboard data based on selected competition and year
    const { data: scores, isLoading } = api.written.getLeaderboard.useQuery(
        {
            competition: competitionParam as any,
            year: yearParam,
            includeFormer,
        },
        {
            enabled:
                selectedCompetition !== undefined && selectedYear !== undefined,
        },
    );

    // Rank before filtering by search term, so ranks don't change while
    // searching. Scores arrive sorted, highest first.
    const filteredData = useMemo(() => {
        if (!scores) return [];
        const term = searchTerm.toLowerCase();
        return scores
            .map((entry, index) => ({ ...entry, rank: index + 1 }))
            .filter((entry) => entry.name.toLowerCase().includes(term));
    }, [scores, searchTerm]);
    const pagination = usePagination(filteredData);

    // Back to the first page when another year or competition loads.
    const { setPage } = pagination;
    useEffect(() => setPage(0), [scores, setPage]);

    return (
        <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-sm">
            <div className="mb-4 space-y-4">
                <div>
                    <label className="mb-2 block text-sm font-medium">
                        Season Year
                    </label>
                    <Select
                        value={selectedYear?.toString()}
                        onValueChange={(value) => setSelectedYear(value)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a year" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Years</SelectItem>
                            <SelectItem value="current">
                                Current Year ({getCurrentYear()})
                            </SelectItem>
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
                                <SelectItem key={comp} value={comp}>
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
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        pagination.setPage(0);
                    }}
                    className="w-full"
                />
                <IncludeFormerCheckbox
                    checked={includeFormer}
                    onChange={(checked) => {
                        setIncludeFormer(checked);
                        // The default competition may change too.
                        setSelectedCompetition(undefined);
                    }}
                />
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">Rank</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading || selectedCompetition === undefined ? (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                                Loading...
                            </TableCell>
                        </TableRow>
                    ) : filteredData.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                                No scores yet.
                            </TableCell>
                        </TableRow>
                    ) : (
                        pagination.pageItems.map((entry) => (
                            <TableRow key={entry.id}>
                                <TableCell className="font-medium">
                                    {entry.rank}
                                </TableCell>
                                <TableCell>
                                    {entry.name}
                                    {entry.former && <FormerBadge />}
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
        </div>
    );
}
