"use client";

import { useEffect, useState } from "react";
import { formatDistance } from "date-fns";

const HOUR_MS = 60 * 60 * 1000;

const pad = (n: number) => n.toString().padStart(2, "0");

/**
 * "42:07", or "2:05:07" with an hour or more left, rounded up to the next
 * second.
 */
function clock(ms: number) {
    const seconds = Math.ceil(ms / 1000);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds / 60) % 60;
    const s = seconds % 60;
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/**
 * Time left until a moment `inMs` away (measured on the server, so the
 * viewer's clock doesn't matter): "in about 3 hours", then a ticking
 * "in 42:07" within the last hour, then `doneText`. With `exact`, it ticks
 * the whole time ("in 2:05:07").
 */
export function Countdown({
    inMs,
    doneText,
    prefix = "",
    exact = false,
}: {
    inMs: number;
    doneText: string;
    /** Before the clock, e.g. "in " for "in 42:07". */
    prefix?: string;
    /** Always show the ticking clock, e.g. while a contest is running. */
    exact?: boolean;
}) {
    const [remaining, setRemaining] = useState(inMs);

    useEffect(() => {
        const deadline = Date.now() + inMs;
        const tick = () => setRemaining(deadline - Date.now());
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [inMs]);

    if (remaining <= 0) return <>{doneText}</>;
    if (exact || remaining < HOUR_MS) {
        return (
            <span className="tabular-nums">
                {prefix}
                {clock(remaining)}
            </span>
        );
    }
    return <>{formatDistance(remaining, 0, { addSuffix: true })}</>;
}
