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
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
    competitionLabel,
    type WrittenCompetition,
} from "~/lib/written/competitions";
import { currentSeasonYear, parseSeasonYear } from "~/lib/written/season";
import { api } from "~/trpc/react";
import { FormerBadge, IncludeFormerCheckbox } from "../former";
import {
    downloadWrittenCsv,
    downloadWrittenPdf,
    type WrittenReportView,
} from "./report";

/** The teacher's students ranked by written test score. */
export default function WrittenLeaderboard() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCompetition, setSelectedCompetition] = useState<
        WrittenCompetition | "all" | undefined
    >(undefined);
    // "all", "current" or a season year like "2027".
    const [selectedYear, setSelectedYear] = useState("current");
    const [includeFormer, setIncludeFormer] = useState(false);

    // Fetch available years (not year-dependent)
    const { data: years } = api.written.getAvailableYears.useQuery();

    // Determine year parameter before using it in dependent queries
    const yearParam = parseSeasonYear(selectedYear);

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
            competition: competitionParam,
            year: yearParam,
            includeFormer,
        },
        {
            enabled: selectedCompetition !== undefined,
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

    // What the filters and search show (every page), for the downloads.
    const { data: school } = api.school.getMine.useQuery();
    const reportView: WrittenReportView = {
        school: school?.name,
        season: yearParam?.toString() ?? "All seasons",
        competition:
            competitionParam === undefined
                ? "All competitions"
                : competitionLabel(competitionParam),
        includeFormer,
        searchTerm,
        rows: filteredData,
    };
    const canDownload = !isLoading && selectedCompetition !== undefined;
    const [pdfPending, setPdfPending] = useState(false);

    return (
        <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-sm">
            <div className="mb-4 space-y-4">
                <div>
                    <label className="mb-2 block text-sm font-medium">
                        Season Year
                    </label>
                    <Select
                        value={selectedYear}
                        onValueChange={setSelectedYear}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a year" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Years</SelectItem>
                            <SelectItem value="current">
                                Current Season ({currentSeasonYear()})
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
                        onValueChange={(value) =>
                            setSelectedCompetition(
                                value as WrittenCompetition | "all",
                            )
                        }
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
                                    {competitionLabel(comp)}
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
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!canDownload}
                        onClick={() => downloadWrittenCsv(reportView)}
                    >
                        <Download className="mr-1.5 h-4 w-4" />
                        Export CSV
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!canDownload || pdfPending}
                        onClick={async () => {
                            setPdfPending(true);
                            try {
                                await downloadWrittenPdf(reportView);
                            } catch {
                                toast.error("Couldn't generate the report.");
                            } finally {
                                setPdfPending(false);
                            }
                        }}
                    >
                        <FileText className="mr-1.5 h-4 w-4" />
                        {pdfPending ? "Generating…" : "PDF report"}
                    </Button>
                </div>
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
