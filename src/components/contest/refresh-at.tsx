"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Longest delay setTimeout supports (~24.8 days); longer ones fire at once. */
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/** A moment past the target, so the server sees it as reached. */
const SLACK_MS = 1000;

/**
 * Re-renders the page's server components once `inMs` has passed, e.g. to
 * show a contest's problems when it starts. `inMs` is measured on the
 * server, so a wrong clock on the viewer's computer doesn't matter.
 */
export function RefreshAt({ inMs }: { inMs: number }) {
    const router = useRouter();
    useEffect(() => {
        const delay = Math.max(0, inMs) + SLACK_MS;
        // Too far off to wait for; the page will have been reloaded by then.
        if (delay > MAX_TIMEOUT_MS) return;
        const timer = setTimeout(() => router.refresh(), delay);
        return () => clearTimeout(timer);
    }, [inMs, router]);
    return null;
}
