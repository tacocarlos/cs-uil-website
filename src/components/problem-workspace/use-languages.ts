import { useMemo } from "react";
import { api } from "~/trpc/react";
import { FALLBACK_LANGUAGES, toLanguageConfig } from "./languages";

export type LanguageOptions = {
    /** Only offer languages the LSP gateway supports. */
    lspOnly?: boolean;
};

/**
 * Languages available on the Judge0 instance, sorted by name. Falls back to
 * a small built-in list if Judge0 can't be reached. `isReady` is false only
 * while the first request is in flight.
 */
export function useLanguages({ lspOnly = false }: LanguageOptions = {}) {
    const { data, isPending } = api.execute.getLanguages.useQuery(undefined, {
        staleTime: Infinity,
        retry: 1,
    });

    const languages = useMemo(
        () =>
            (data?.length ? data : FALLBACK_LANGUAGES)
                .map(toLanguageConfig)
                .filter((l) => !lspOnly || l.hasLsp)
                .sort((a, b) => a.name.localeCompare(b.name)),
        [data, lspOnly],
    );

    return { languages, isReady: !isPending };
}
