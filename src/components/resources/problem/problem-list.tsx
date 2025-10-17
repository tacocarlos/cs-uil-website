"use client";

import { Accordion } from "~/components/ui/accordion";
import { ProblemAccordionItem } from "./problem-accordion-item";
import { type Problem } from "~/server/db/schema/types";
import { api } from "~/trpc/react";
import { useSession } from "auth-client";
import { submission, type Submission } from "~/server/db/schema/submission";
import { Input } from "~/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { useState, useMemo } from "react";
import { Search, Filter } from "lucide-react";

export default function ProblemList({
    problems,
    className,
}: {
    problems: Problem[];
    className?: string;
}) {
    const { data: session } = useSession();
    const user = session?.user;

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedYear, setSelectedYear] = useState<string>("all");
    const [selectedLevel, setSelectedLevel] = useState<string>("all");

    // Get unique years and levels for filter dropdowns
    const years = useMemo(() => {
        const uniqueYears = Array.from(
            new Set(problems.map((p) => p.competitionYear)),
        ).sort((a, b) => b - a);
        return uniqueYears;
    }, [problems]);

    const levels = [
        "invA",
        "invB",
        "district",
        "region",
        "state",
        "custom",
    ] as const;

    // Filter problems based on search and filters
    const filteredProblems = useMemo(() => {
        return problems.filter((problem) => {
            // Search filter
            const matchesSearch = problem.problemName
                .toLowerCase()
                .includes(searchQuery.toLowerCase());

            // Year filter
            const matchesYear =
                selectedYear === "all" ||
                problem.competitionYear.toString() === selectedYear;

            // Level filter
            const matchesLevel =
                selectedLevel === "all" ||
                problem.competitionLevel === selectedLevel;

            return matchesSearch && matchesYear && matchesLevel;
        });
    }, [problems, searchQuery, selectedYear, selectedLevel]);

    const submissions = filteredProblems.map((p) => {
        return undefined;
    });

    const pairs: [Problem, Submission | undefined][] = [];
    for (
        let i = 0;
        i < filteredProblems.length && i < submissions.length;
        i++
    ) {
        pairs.push([filteredProblems[i]!, submissions[i]]);
    }

    return (
        <div className={`mx-auto max-w-3xl ${className ?? ""}`}>
            {/* Search and Filter Controls */}
            <div className="mb-6 space-y-4">
                {/* Search Input */}
                <div className="relative">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                        placeholder="Search problems by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Filter Controls */}
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                    <div className="flex flex-1 items-center gap-2">
                        <Filter className="text-muted-foreground h-4 w-4" />
                        <Select
                            value={selectedYear}
                            onValueChange={setSelectedYear}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Filter by year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Years</SelectItem>
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
                                <SelectItem value="all">All Levels</SelectItem>
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

                {/* Results Count */}
                <div className="text-muted-foreground text-sm">
                    Showing {pairs.length} of {problems.length} problem
                    {problems.length !== 1 ? "s" : ""}
                </div>
            </div>

            {/* Problem List */}
            {pairs.length > 0 ? (
                <Accordion type="multiple">
                    {pairs.map(([problem, s]) => (
                        <ProblemAccordionItem
                            key={problem.id}
                            problem={problem}
                            mostRecentSubmission={s}
                        />
                    ))}
                </Accordion>
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
