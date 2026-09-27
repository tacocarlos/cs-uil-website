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
