import { useEffect, useState } from "react";

/** useState backed by localStorage under `key`. */
export function usePersistedState(key: string, fallback: string) {
    const [value, setValue] = useState(() => {
        if (typeof window === "undefined") return fallback;
        return window.localStorage.getItem(key) ?? fallback;
    });

    useEffect(() => {
        window.localStorage.setItem(key, value);
    }, [key, value]);

    return [value, setValue] as const;
}

export function usePersistedStateJSON<T>(key: string, fallback: T) {
    const [value, setValue] = useState<T>(() => {
        if (typeof window === "undefined") return fallback;
        const stored = window.localStorage.getItem(key);
        if (!stored) return fallback;
        try {
            return JSON.parse(stored) as T;
        } catch {
            console.warn(`Failed to parse JSON from localStorage key "${key}"`);
            return fallback;
        }
    });

    useEffect(() => {
        window.localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue] as const;
}
