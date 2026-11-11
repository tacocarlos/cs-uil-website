import { useEffect, useMemo, useRef } from "react";

/** Something a subscriber does on each refresh, e.g. a query's `refetch`. */
export type Refresher = () => unknown;

/**
 * Drives refreshes for a group of components so they all update together.
 * Components register with {@link useRefreshSubscription}; on every tick
 * the controller runs all subscribers at once.
 */
export interface RefreshController {
    /** Registers a subscriber; returns a function that unregisters it. */
    subscribe: (refresher: Refresher) => () => void;
    /**
     * Runs every subscriber now and resolves when all have settled. Calls
     * made while a refresh is in flight share that refresh.
     */
    refreshNow: () => Promise<void>;
}

/**
 * Creates a {@link RefreshController} that refreshes its subscribers every
 * `intervalMs` while `enabled`. Ticks are skipped while the tab is hidden,
 * and a refresh runs as soon as it becomes visible again.
 */
export function useRefreshController({
    intervalMs,
    enabled = true,
}: {
    intervalMs: number;
    enabled?: boolean;
}): RefreshController {
    const subscribers = useRef(new Set<Refresher>());
    const inFlight = useRef<Promise<void> | null>(null);

    const controller = useMemo<RefreshController>(
        () => ({
            subscribe: (refresher) => {
                subscribers.current.add(refresher);
                return () => {
                    subscribers.current.delete(refresher);
                };
            },
            refreshNow: () => {
                inFlight.current ??= Promise.allSettled(
                    [...subscribers.current].map((refresh) => refresh()),
                ).then(() => {
                    inFlight.current = null;
                });
                return inFlight.current;
            },
        }),
        [],
    );

    useEffect(() => {
        if (!enabled) return;

        const tick = () => {
            if (document.visibilityState === "visible") {
                void controller.refreshNow();
            }
        };
        const timer = setInterval(tick, intervalMs);
        document.addEventListener("visibilitychange", tick);
        return () => {
            clearInterval(timer);
            document.removeEventListener("visibilitychange", tick);
        };
    }, [controller, intervalMs, enabled]);

    return controller;
}

/**
 * Runs `refresher` on every refresh of `controller`. The latest `refresher`
 * is always used, so it needn't be memoized.
 */
export function useRefreshSubscription(
    controller: RefreshController,
    refresher: Refresher,
) {
    const latest = useRef(refresher);
    useEffect(() => {
        latest.current = refresher;
    });

    useEffect(() => controller.subscribe(() => latest.current()), [controller]);
}
