import { lspTargetFor } from "~/lib/lsp/servers";
import { LANGUAGE_FAMILIES } from "./language-families";

/** A language as listed by Judge0's /languages endpoint. */
export type Judge0Language = {
    /** Judge0 language ID */
    id: string;
    /** Judge0's display name, including version, e.g. "Java (OpenJDK 13.0.1)" */
    name: string;
};

export type LanguageConfig = Judge0Language & {
    /** Monaco editor language identifier */
    monacoLang: string;
    /** Code shown in a fresh editor */
    starterCode: string;
    /** Whether the LSP gateway has a language server for it */
    hasLsp: boolean;
};

export const DEFAULT_LANGUAGE_ID = "62"; // Java (OpenJDK 13.0.1)

/** Used while the live list loads, or if Judge0 can't be reached. */
export const FALLBACK_LANGUAGES: Judge0Language[] = [
    { id: "62", name: "Java (OpenJDK 13.0.1)" },
    { id: "50", name: "C (GCC 9.2.0)" },
    { id: "54", name: "C++ (GCC 9.2.0)" },
    { id: "71", name: "Python (3.8.1)" },
];

/** "C++ (GCC 9.2.0)" → "C++" */
export function languageFamily(name: string): string {
    return name.replace(/\s*\(.*\)\s*$/, "");
}

export function toLanguageConfig(language: Judge0Language): LanguageConfig {
    const familyName = languageFamily(language.name);
    const family = LANGUAGE_FAMILIES[familyName];
    return {
        ...language,
        monacoLang: family?.monacoLang ?? "plaintext",
        starterCode: family?.starterCode ?? "",
        hasLsp: lspTargetFor(familyName) !== undefined,
    };
}

/**
 * Extra search terms per family, for names fuzzy search wouldn't find from
 * the display name alone (e.g. "cpp" never matches "C++ (GCC 9.2.0)").
 */
export const SEARCH_ALIASES: Record<string, string[]> = {
    "C++": ["cpp", "cplusplus"],
    "C#": ["csharp", "cs", "dotnet"],
    "F#": ["fsharp", "dotnet"],
    "Visual Basic.Net": ["vb", "vbnet", "dotnet"],
    JavaScript: ["js", "node"],
    TypeScript: ["ts"],
    Python: ["py"],
    Go: ["golang"],
    "Objective-C": ["objc"],
    "Common Lisp": ["lisp", "sbcl"],
    Assembly: ["asm", "nasm"],
    Bash: ["shell", "sh"],
};

/** Search terms for a language: its family name plus any aliases. */
export function searchKeywords(language: LanguageConfig): string[] {
    const family = languageFamily(language.name);
    return [family, ...(SEARCH_ALIASES[family] ?? [])];
}

export type LanguageFilter = "all" | "lsp";

/**
 * Languages to list, in display groups: LSP-supported first so they're easy
 * to find. Groups with no languages are omitted.
 */
export function groupLanguages(
    languages: LanguageConfig[],
    filter: LanguageFilter,
): { heading: string; languages: LanguageConfig[] }[] {
    const groups = [
        {
            heading: "LSP supported",
            languages: languages.filter((l) => l.hasLsp),
        },
        {
            heading: "Other languages",
            languages:
                filter === "lsp" ? [] : languages.filter((l) => !l.hasLsp),
        },
    ];
    return groups.filter((g) => g.languages.length > 0);
}

/** The language with `id`, else the default, else the first available. */
export function findLanguage(
    languages: LanguageConfig[],
    id: string,
): LanguageConfig {
    return (
        languages.find((l) => l.id === id) ??
        languages.find((l) => l.id === DEFAULT_LANGUAGE_ID) ??
        languages[0]!
    );
}
