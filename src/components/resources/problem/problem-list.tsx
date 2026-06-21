"use client";

import { type Problem } from "~/server/db/schema/types";
import type { Submission } from "~/server/db/schema/submission";
import { ProblemCard } from "./problem-card";
import { Input } from "~/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { useState, useMemo, useEffect } from "react";
import { Search, Filter } from "lucide-react";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "~/components/ui/pagination";

export default function ProblemList({
    problems,
    className,
}: {
    problems: Problem[];
    className?: string;
}) {
    const ITEMS_PER_PAGE = 9; // 3 rows × 3 columns

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedYear, setSelectedYear] = useState<string>("all");
    const [selectedLevel, setSelectedLevel] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);

    // Reset to page 1 whenever any filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedYear, selectedLevel]);

    const years = useMemo(
        () =>
            Array.from(new Set(problems.map((p) => p.competitionYear))).sort(
                (a, b) => b - a,
            ),
        [problems],
    );

    const filteredProblems = useMemo(
        () =>
            problems.filter((p) => {
                const matchesSearch = p.problemName
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase());
                const matchesYear =
                    selectedYear === "all" ||
                    p.competitionYear.toString() === selectedYear;
                const matchesLevel =
                    selectedLevel === "all" ||
                    p.competitionLevel === selectedLevel;
                return matchesSearch && matchesYear && matchesLevel;
            }),
        [problems, searchQuery, selectedYear, selectedLevel],
    );

    // Submissions are not yet loaded from the API; placeholder for future use.
    const pairs: [Problem, Submission | undefined][] = filteredProblems.map(
        (p) => [p, undefined],
    );

    const totalPages = Math.max(1, Math.ceil(pairs.length / ITEMS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const pageStart = (safePage - 1) * ITEMS_PER_PAGE;
    const visiblePairs = pairs.slice(pageStart, pageStart + ITEMS_PER_PAGE);

    /** Returns page numbers (or "ellipsis" sentinels) for the pagination bar. */
    function getPageNumbers(
        current: number,
        total: number,
    ): (number | "ellipsis")[] {
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

        const pages: (number | "ellipsis")[] = [1];
        if (current > 3) pages.push("ellipsis");
        const start = Math.max(2, current - 1);
        const end = Math.min(total - 1, current + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (current < total - 2) pages.push("ellipsis");
        pages.push(total);
        return pages;
    }

    return (
        <div className={className}>
            {/* Search and filter controls */}
            <div className="mb-6 space-y-4">
                <div className="relative">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                        placeholder="Search problems by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                    <div className="flex flex-1 items-center gap-2">
                        <Filter className="text-muted-foreground h-4 w-4 shrink-0" />
                        <Select
                            value={selectedYear}
                            onValueChange={setSelectedYear}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Filter by year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All years</SelectItem>
                                {years.map((year) => (
                                    <SelectItem
                                        key={year}
                                        value={year.toString()}
                                    >
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-1">
                        <Select
                            value={selectedLevel}
                            onValueChange={setSelectedLevel}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Filter by level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All levels</SelectItem>
                                <SelectItem value="invA">
                                    Invitational A
                                </SelectItem>
                                <SelectItem value="invB">
                                    Invitational B
                                </SelectItem>
                                <SelectItem value="district">
                                    District
                                </SelectItem>
                                <SelectItem value="region">Region</SelectItem>
                                <SelectItem value="state">State</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <p className="text-muted-foreground text-sm">
                    Showing {pageStart + 1}–
                    {Math.min(pageStart + ITEMS_PER_PAGE, pairs.length)} of{" "}
                    {filteredProblems.length} problem
                    {filteredProblems.length !== 1 ? "s" : ""}
                    {filteredProblems.length !== problems.length &&
                        ` (${problems.length} total)`}
                </p>
            </div>

            {/* Card grid */}
            {pairs.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {visiblePairs.map(([problem, submission]) => (
                            <ProblemCard
                                key={problem.id}
                                problem={problem}
                                mostRecentSubmission={submission}
                            />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <Pagination className="mt-8">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.max(1, p - 1),
                                            )
                                        }
                                        aria-disabled={safePage === 1}
                                        className={
                                            safePage === 1
                                                ? "pointer-events-none opacity-50"
                                                : "cursor-pointer"
                                        }
                                    />
                                </PaginationItem>

                                {getPageNumbers(safePage, totalPages).map(
                                    (entry, i) =>
                                        entry === "ellipsis" ? (
                                            <PaginationItem
                                                key={`ellipsis-${i}`}
                                            >
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                        ) : (
                                            <PaginationItem key={entry}>
                                                <PaginationLink
                                                    isActive={
                                                        entry === safePage
                                                    }
                                                    onClick={() =>
                                                        setCurrentPage(entry)
                                                    }
                                                    className="cursor-pointer"
                                                >
                                                    {entry}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ),
                                )}

                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.min(totalPages, p + 1),
                                            )
                                        }
                                        aria-disabled={safePage === totalPages}
                                        className={
                                            safePage === totalPages
                                                ? "pointer-events-none opacity-50"
                                                : "cursor-pointer"
                                        }
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </>
            ) : (
                <div className="text-muted-foreground py-12 text-center">
                    <p className="text-lg">No problems found</p>
                    <p className="mt-2 text-sm">
                        Try adjusting your search or filters
                    </p>
                </div>
            )}
        </div>
    );
}
