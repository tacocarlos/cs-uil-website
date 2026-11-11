"use client";

import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
} from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "~/components/ui/chart";
import { Skeleton } from "~/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import { DAILY_CHART_DAYS, type RetentionRow } from "~/lib/analytics";
import { api, type RouterOutputs } from "~/trpc/react";

type Daily = RouterOutputs["analytics"]["daily"];
type DailyKey = "activeUsers" | "signUps" | "signIns";

// All single-series charts, so one hue (the theme's mid chart blue).
const chartConfig = {
    activeUsers: { label: "Active users", color: "var(--chart-2)" },
    signUps: { label: "Sign-ups", color: "var(--chart-2)" },
    signIns: { label: "Sign-ins", color: "var(--chart-2)" },
} satisfies ChartConfig;

const shortDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
});

/** "Nov 3" for "2026-11-03". */
function formatDay(day: string) {
    return shortDate.format(new Date(`${day}T00:00:00Z`));
}

const percent = new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 0,
});

/** Site usage for site admins: headline numbers, daily charts, retention. */
export function SiteAnalytics() {
    const summary = api.analytics.summary.useQuery();
    const daily = api.analytics.daily.useQuery();
    const retention = api.analytics.retention.useQuery();

    return (
        <div className="space-y-6">
            <SummaryTiles summary={summary.data} />
            {summary.data && (
                <p className="text-muted-foreground text-sm">
                    {summary.data.trackingSince
                        ? `Activity has been recorded since ${formatDay(summary.data.trackingSince)}; active-user counts and retention before then are missing.`
                        : "No activity recorded yet. Active-user counts start once people use the site."}{" "}
                    Days are in Central Time.
                </p>
            )}
            <DailyChart
                title="Active users"
                description={`People who used the site while signed in, per day, last ${DAILY_CHART_DAYS} days`}
                dataKey="activeUsers"
                data={daily.data}
                kind="area"
            />
            <div className="grid gap-6 md:grid-cols-2">
                <DailyChart
                    title="Sign-ups"
                    description="New accounts per day"
                    dataKey="signUps"
                    data={daily.data}
                    kind="bar"
                />
                <DailyChart
                    title="Sign-ins"
                    description="Sign-ins per day"
                    dataKey="signIns"
                    data={daily.data}
                    kind="bar"
                />
            </div>
            <RetentionTable rows={retention.data} />
        </div>
    );
}

function SummaryTiles({
    summary,
}: {
    summary: RouterOutputs["analytics"]["summary"] | undefined;
}) {
    const tiles = [
        { label: "Total users", value: summary?.totalUsers },
        {
            label: `New in last ${DAILY_CHART_DAYS} days`,
            value: summary?.newUsers,
        },
        { label: "Active today", value: summary?.activeToday },
        { label: "Active last 7 days", value: summary?.activeThisWeek },
        { label: "Active last 30 days", value: summary?.activeThisMonth },
    ];
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {tiles.map((tile) => (
                <Card key={tile.label} className="gap-1 py-4">
                    <CardHeader className="px-4">
                        <CardDescription>{tile.label}</CardDescription>
                    </CardHeader>
                    <CardContent className="px-4">
                        {tile.value === undefined ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <p className="text-2xl font-semibold tabular-nums">
                                {tile.value.toLocaleString()}
                            </p>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function DailyChart({
    title,
    description,
    dataKey,
    data,
    kind,
}: {
    title: string;
    description: string;
    dataKey: DailyKey;
    data: Daily | undefined;
    kind: "area" | "bar";
}) {
    const color = `var(--color-${dataKey})`;
    const axes = (
        <>
            <CartesianGrid vertical={false} />
            <XAxis
                dataKey="day"
                tickFormatter={formatDay}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
            />
            <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={32}
            />
            <ChartTooltip
                cursor={kind === "area"}
                content={
                    <ChartTooltipContent
                        labelFormatter={(_, payload) => {
                            const day = (
                                payload[0]?.payload as { day?: string }
                            )?.day;
                            return day ? formatDay(day) : "";
                        }}
                    />
                }
            />
        </>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {data ? (
                    <ChartContainer
                        config={chartConfig}
                        className="aspect-auto h-56 w-full"
                    >
                        {kind === "area" ? (
                            <AreaChart
                                data={data}
                                margin={{ left: 0, right: 8 }}
                            >
                                {axes}
                                <Area
                                    dataKey={dataKey}
                                    type="monotone"
                                    stroke={color}
                                    strokeWidth={2}
                                    fill={color}
                                    fillOpacity={0.15}
                                    activeDot={{ r: 4 }}
                                />
                            </AreaChart>
                        ) : (
                            <BarChart
                                data={data}
                                margin={{ left: 0, right: 8 }}
                            >
                                {axes}
                                <Bar
                                    dataKey={dataKey}
                                    fill={color}
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        )}
                    </ChartContainer>
                ) : (
                    <Skeleton className="h-56 w-full" />
                )}
                {data && (
                    <details className="text-sm">
                        <summary className="text-muted-foreground cursor-pointer">
                            View as table
                        </summary>
                        <Table className="mt-2">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Day</TableHead>
                                    <TableHead className="text-right">
                                        {chartConfig[dataKey].label}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[...data].reverse().map((row) => (
                                    <TableRow key={row.day}>
                                        <TableCell>
                                            {formatDay(row.day)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {row[dataKey]}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </details>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Sign-up weeks down the side, weeks since across the top; each cell is the
 * share of that week's new users active in that week. Shaded by value, with
 * the percentage printed so it isn't color alone.
 */
function RetentionTable({ rows }: { rows: RetentionRow[] | undefined }) {
    const weeks = rows?.[0]?.rates.length ?? 0;
    return (
        <Card>
            <CardHeader>
                <CardTitle>Weekly retention</CardTitle>
                <CardDescription>
                    Of the people who signed up each week, the share who used
                    the site in that week and each week after
                </CardDescription>
            </CardHeader>
            <CardContent>
                {rows ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Signed up week of</TableHead>
                                <TableHead className="text-right">
                                    Users
                                </TableHead>
                                {Array.from({ length: weeks }, (_, i) => (
                                    <TableHead key={i} className="text-center">
                                        {i === 0 ? "Same week" : `Week ${i}`}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...rows].reverse().map((row) => (
                                <TableRow key={row.week}>
                                    <TableCell>{formatDay(row.week)}</TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {row.signUps}
                                    </TableCell>
                                    {row.rates.map((rate, i) => (
                                        <RetentionCell
                                            key={i}
                                            rate={row.signUps ? rate : null}
                                        />
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <Skeleton className="h-64 w-full" />
                )}
            </CardContent>
        </Card>
    );
}

function RetentionCell({ rate }: { rate: number | null }) {
    if (rate === null) return <TableCell />;
    return (
        <TableCell className="p-0.5">
            <div
                className="rounded-sm py-1.5 text-center tabular-nums"
                style={{
                    // One hue, light to dark with the value; capped so the
                    // printed percentage stays readable.
                    backgroundColor: `color-mix(in oklch, var(--chart-2) ${Math.round(8 + rate * 62)}%, transparent)`,
                }}
            >
                {percent.format(rate)}
            </div>
        </TableCell>
    );
}
