import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * localStorage.getItem, or null when storage is unavailable (blocked, or
 * some in-app browsers) instead of throwing.
 */
export function readStorage(key: string): string | null {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

/** localStorage.setItem that ignores unavailable or full storage. */
export function writeStorage(key: string, value: string) {
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // Nothing persists, but the editor keeps working.
    }
}

// Values set this page load, so they stick even when storage is unavailable
// (they just won't outlast the page), and listeners per key.
const memory = new Map<string, string>();
const listeners = new Map<string, Set<() => void>>();

function subscribe(key: string, listener: () => void) {
    let set = listeners.get(key);
    if (!set) listeners.set(key, (set = new Set()));
    set.add(listener);
    return () => set.delete(listener);
}

function read(key: string): string | null {
    return memory.get(key) ?? readStorage(key);
}

function write(key: string, value: string) {
    memory.set(key, value);
    writeStorage(key, value);
    listeners.get(key)?.forEach((l) => l());
}

type SetValue<T> = (next: T | ((prev: T) => T)) => void;

/**
 * State backed by localStorage under `key`.
 *
 * Renders `fallback` on the server and while hydrating, then the saved
 * value, so the server's HTML and the first client render always match.
 * Use `useHydrated` to hold back anything that must start from the saved
 * value.
 *
 * Other tabs' changes aren't picked up: e.g. the editor's language and
 * its code must change together.
 */
export function usePersistedState(
    key: string,
    fallback: string,
): readonly [string, SetValue<string>] {
    const value = useSyncExternalStore(
        useCallback((listener) => subscribe(key, listener), [key]),
        () => read(key) ?? fallback,
        () => fallback,
    );
    const setValue = useCallback<SetValue<string>>(
        (next) =>
            write(
                key,
                typeof next === "function" ? next(read(key) ?? fallback) : next,
            ),
        [key, fallback],
    );
    return [value, setValue] as const;
}

/** `usePersistedState` for JSON values. */
export function usePersistedStateJSON<T>(
    key: string,
    fallback: T,
): readonly [T, SetValue<T>] {
    // Compared as a string, so a fallback object rebuilt every render
    // doesn't count as a change.
    const fallbackJson = JSON.stringify(fallback);
    const [raw, setRaw] = usePersistedState(key, fallbackJson);
    const value = useMemo(
        () => parseOr<T>(raw, key, fallbackJson),
        [raw, key, fallbackJson],
    );
    const setValue = useCallback<SetValue<T>>(
        (next) =>
            setRaw((prevRaw) =>
                JSON.stringify(
                    typeof next === "function"
                        ? (next as (prev: T) => T)(
                              parseOr<T>(prevRaw, key, fallbackJson),
                          )
                        : next,
                ),
            ),
        [setRaw, key, fallbackJson],
    );
    return [value, setValue] as const;
}

function parseOr<T>(raw: string, key: string, fallbackJson: string): T {
    try {
        return JSON.parse(raw) as T;
    } catch {
        console.warn(`Failed to parse JSON from localStorage key "${key}"`);
        return JSON.parse(fallbackJson) as T;
    }
}

const noSubscription = () => () => undefined;

/** False on the server and while hydrating, true after. */
export function useHydrated(): boolean {
    return useSyncExternalStore(
        noSubscription,
        () => true,
        () => false,
    );
}
