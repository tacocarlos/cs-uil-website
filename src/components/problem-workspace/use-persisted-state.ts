import { useEffect, useState } from "react";

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

/** useState backed by localStorage under `key`. */
export function usePersistedState(key: string, fallback: string) {
    const [value, setValue] = useState(() => {
        if (typeof window === "undefined") return fallback;
        return readStorage(key) ?? fallback;
    });

    useEffect(() => {
        writeStorage(key, value);
    }, [key, value]);

    return [value, setValue] as const;
}

export function usePersistedStateJSON<T>(key: string, fallback: T) {
    const [value, setValue] = useState<T>(() => {
        if (typeof window === "undefined") return fallback;
        const stored = readStorage(key);
        if (!stored) return fallback;
        try {
            return JSON.parse(stored) as T;
        } catch {
            console.warn(`Failed to parse JSON from localStorage key "${key}"`);
            return fallback;
        }
    });

    useEffect(() => {
        writeStorage(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue] as const;
}
