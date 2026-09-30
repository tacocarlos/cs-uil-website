"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import {
    LeaderboardPagination,
    usePagination,
} from "~/app/leaderboard/pagination";
import { TEAM_SIZE, type TeamStatistic } from "~/lib/written/statistics";
import { api } from "~/trpc/react";
import { FormerBadge, IncludeFormerCheckbox } from "../former";

const LIFETIME = "lifetime";

/** Averages can be fractional; show at most one decimal. */
function formatScore(score: number) {
    return Number.isInteger(score) ? score.toString() : score.toFixed(1);
}

function SchoolCard({
    title,
    description,
    team,
}: {
    title: string;
    description: string;
    team: TeamStatistic;
}) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <p className="text-3xl font-bold">{formatScore(team.total)}</p>
                <p className="text-muted-foreground text-xs">{description}</p>
                {team.counted.length > 0 && (
                    <ul className="text-sm">
                        {team.counted.map((s) => (
                            <li key={s.userId} className="flex justify-between">
                                <span>
                                    {s.name}
                                    {s.former && <FormerBadge />}
                                </span>
                                <span>{formatScore(s.score)}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

/** Optimal and expected written scores for a season year or lifetime. */
export function WrittenStatistics() {
    const [period, setPeriod] = useState<string>(LIFETIME);
    const [includeFormer, setIncludeFormer] = useState(false);
    const year = period === LIFETIME ? undefined : Number(period);

    const { data: years } = api.written.getAvailableYears.useQuery();
    const { data: stats, isPending } = api.written.getStatistics.useQuery({
        year,
        includeFormer,
    });
    const pagination = usePagination(stats?.students ?? []);

    const periodLabel =
        year === undefined ? "across all their tests" : `in the ${year} season`;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium">Period</span>
                <Select
                    value={period}
                    onValueChange={(value) => {
                        setPeriod(value);
                        pagination.setPage(0);
                    }}
                >
                    <SelectTrigger className="w-48 bg-white">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={LIFETIME}>Lifetime</SelectItem>
                        {years?.map((y) => (
                            <SelectItem key={y} value={y.toString()}>
                                {y} season
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <IncludeFormerCheckbox
                    checked={includeFormer}
                    onChange={(checked) => {
                        setIncludeFormer(checked);
                        pagination.setPage(0);
                    }}
                />
            </div>

            {isPending || !stats ? (
                <Skeleton className="h-64 w-full" />
            ) : stats.students.length === 0 ? (
                <p className="text-muted-foreground rounded-xl bg-white p-8 text-center text-sm">
                    No written scores for this period yet.
                </p>
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <SchoolCard
                            title="School optimal"
                            description={`The ${TEAM_SIZE} best student optimals, added together like a UIL team score.`}
                            team={stats.school.optimal}
                        />
                        <SchoolCard
                            title="School expected"
                            description={`The ${TEAM_SIZE} best student expected scores, added together.`}
                            team={stats.school.expected}
                        />
                    </div>

                    <div className="rounded-xl bg-white p-4 shadow-sm">
                        <p className="text-muted-foreground mb-3 text-sm">
                            Optimal is each student&apos;s best score{" "}
                            {periodLabel}; expected is their average.
                        </p>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead className="text-right">
                                        Tests
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Optimal
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Expected
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pagination.pageItems.map((s) => (
                                    <TableRow key={s.userId}>
                                        <TableCell>
                                            {s.name}
                                            {s.former && <FormerBadge />}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {s.tests}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatScore(s.optimal)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatScore(s.expected)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <LeaderboardPagination pagination={pagination} />
                    </div>
                </>
            )}
        </div>
    );
}
