"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

// ── Constants ─────────────────────────────────────────────────────────────────

const REFRESH_MS = 5_000;

// SVG ring geometry
const RING_RADIUS = 7;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// ── Types ───────────────────────────────────────────────────────────────────

interface Judge0Worker {
    queue: string; size: number; available: number;
    idle: number; working: number; paused: number; failed: number;
}

interface Judge0Status {
    online: boolean;
    about: { version: string } | null;
    workers: Judge0Worker[] | null;
    stats: { submissions: { total: number; today: number } } | null;
}

type HealthState = "healthy" | "no-workers" | "error" | "offline" | "unknown";

// ── Helpers ───────────────────────────────────────────────────────────────────

function deriveHealth(status: Judge0Status): HealthState {
    if (!status.online) return "offline";
    if (!status.workers) return "unknown";
    const working = status.workers.reduce((s, w) => s + w.working, 0);
    const idle    = status.workers.reduce((s, w) => s + w.idle,    0);
    const failed  = status.workers.reduce((s, w) => s + w.failed,  0);
    if (failed > 0)              return "error";
    if (working > 0 || idle > 0) return "healthy";
    return "no-workers";
}

const HEALTH_LABEL: Record<HealthState, string> = {
    healthy:      "Operational",
    "no-workers": "No active workers",
    error:        "Worker failures",
    offline:      "Unreachable",
    unknown:      "Unknown",
};

const HEALTH_COLOR: Record<HealthState, { dot: string; text: string; ring: string }> = {
    healthy:      { dot: "bg-green-500",  text: "text-green-700",  ring: "text-green-500"  },
    "no-workers": { dot: "bg-amber-500",  text: "text-amber-700",  ring: "text-amber-500"  },
    error:        { dot: "bg-red-500",    text: "text-red-700",    ring: "text-red-500"    },
    offline:      { dot: "bg-red-500",    text: "text-red-700",    ring: "text-red-500"    },
    unknown:      { dot: "bg-gray-400",   text: "text-gray-600",   ring: "text-gray-400"   },
};

// ── Countdown ring ────────────────────────────────────────────────────────────
//
// `fraction` goes 0 → 1 as time elapses since the last fetch.
// strokeDashoffset = circumference * fraction:
//   0             → full ring visible  (data just refreshed)
//   circumference → ring is empty      (about to refresh)

function CountdownRing({
    fraction,
    colorClass,
}: {
    fraction: number;
    colorClass: string;
}) {
    const offset = RING_CIRCUMFERENCE * Math.min(fraction, 1);
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            className={`-rotate-90 shrink-0 ${colorClass}`}
            aria-hidden="true"
        >
            {/* Faint track */}
            <circle
                cx="9"
                cy="9"
                r={RING_RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="opacity-20"
            />
            {/* Depleting arc */}
            <circle
                cx="9"
                cy="9"
                r={RING_RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 0.15s linear" }}
            />
        </svg>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export function Judge0StatusCard() {
    // fraction tracks elapsed / REFRESH_MS, updated at ~10 fps for smooth animation
    const [fraction, setFraction] = useState(0);

    const query = api.execute.getJudge0Status.useQuery(undefined, {
        refetchInterval: REFRESH_MS,
    });

    // Recompute fraction whenever dataUpdatedAt changes (i.e. on every refetch)
    // and keep updating it in a fast interval for smooth animation.
    useEffect(() => {
        const id = setInterval(() => {
            if (!query.dataUpdatedAt) return;
            const elapsed = Date.now() - query.dataUpdatedAt;
            setFraction(elapsed / REFRESH_MS);
        }, 100);
        return () => clearInterval(id);
    }, [query.dataUpdatedAt]);

    const status = query.data ?? {
        online: false,
        about: null,
        workers: null,
        stats: null,
    };

    const health  = deriveHealth(status);
    const colors  = HEALTH_COLOR[health];

    const totalWorking = status.workers?.reduce((s, w) => s + w.working, 0) ?? 0;
    const totalIdle    = status.workers?.reduce((s, w) => s + w.idle,    0) ?? 0;
    const totalPaused  = status.workers?.reduce((s, w) => s + w.paused,  0) ?? 0;
    const totalFailed  = status.workers?.reduce((s, w) => s + w.failed,  0) ?? 0;
    const totalQueued  = status.workers?.reduce((s, w) => s + w.size,    0) ?? 0;

    const noData = status.workers === null;

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">Judge0 Status</CardTitle>
                    <div className="flex items-center gap-2">
                        {status.about && (
                            <Badge variant="outline" className="font-mono text-xs">
                                v{status.about.version}
                            </Badge>
                        )}
                        {/* Countdown ring — depletes over 5 s, resets on refetch */}
                        <CountdownRing
                            fraction={fraction}
                            colorClass={colors.ring}
                        />
                    </div>
                </div>

                {/* Health indicator */}
                <div className={`flex items-center gap-2 ${colors.text}`}>
                    <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${colors.dot}`}
                    />
                    <span className="text-sm font-medium">
                        {HEALTH_LABEL[health]}
                    </span>
                </div>
            </CardHeader>

            <CardContent>
                {/* Worker stat tiles */}
                <div className="mb-4 grid grid-cols-4 gap-3 text-center">
                    {(
                        [
                            ["Working", totalWorking, "text-blue-600"],
                            ["Idle",    totalIdle,    "text-green-600"],
                            ["Paused",  totalPaused,  "text-amber-600"],
                            ["Failed",  totalFailed,  "text-red-600"],
                        ] as const
                    ).map(([label, value, color]) => (
                        <div
                            key={label}
                            className="rounded-md border bg-gray-50 py-2"
                        >
                            <p className={`text-xl font-bold ${color}`}>
                                {noData ? "—" : value}
                            </p>
                            <p className="text-muted-foreground text-xs">
                                {label}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Footer row */}
                <div className="text-muted-foreground flex items-center justify-between text-xs">
                    <span>
                        Queue:{" "}
                        <span className="font-medium text-gray-700">
                            {noData ? "—" : `${totalQueued} pending`}
                        </span>
                    </span>
                    {status.stats && (
                        <span>
                            Today:{" "}
                            <span className="font-medium text-gray-700">
                                {status.stats.submissions.today}
                            </span>
                            {" · "}
                            Total:{" "}
                            <span className="font-medium text-gray-700">
                                {status.stats.submissions.total.toLocaleString()}
                            </span>
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
