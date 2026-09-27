import { describe, expect, test } from "bun:test";
import { defaultFilter } from "cmdk";
import {
    DEFAULT_LANGUAGE_ID,
    findLanguage,
    groupLanguages,
    languageFamily,
    SEARCH_ALIASES,
    searchKeywords,
    toLanguageConfig,
} from "./languages";

// Editor languages reported by the Judge0 1.13.1 instance (`/languages`,
// minus Plain Text, Executable, and Multi-file program).
const JUDGE0_LANGUAGE_NAMES = [
    "Assembly (NASM 2.14.02)",
    "Bash (5.0.0)",
    "Basic (FBC 1.07.1)",
    "C (Clang 7.0.1)",
    "C++ (Clang 7.0.1)",
    "C (GCC 7.4.0)",
    "C++ (GCC 7.4.0)",
    "C (GCC 8.3.0)",
    "C++ (GCC 8.3.0)",
    "C (GCC 9.2.0)",
    "C++ (GCC 9.2.0)",
    "Clojure (1.10.1)",
    "C# (Mono 6.6.0.161)",
    "COBOL (GnuCOBOL 2.2)",
    "Common Lisp (SBCL 2.0.0)",
    "D (DMD 2.089.1)",
    "Elixir (1.9.4)",
    "Erlang (OTP 22.2)",
    "F# (.NET Core SDK 3.1.202)",
    "Fortran (GFortran 9.2.0)",
    "Go (1.13.5)",
    "Groovy (3.0.3)",
    "Haskell (GHC 8.8.1)",
    "Java (OpenJDK 13.0.1)",
    "JavaScript (Node.js 12.14.0)",
    "Kotlin (1.3.70)",
    "Lua (5.3.5)",
    "Objective-C (Clang 7.0.1)",
    "OCaml (4.09.0)",
    "Octave (5.1.0)",
    "Pascal (FPC 3.0.4)",
    "Perl (5.28.1)",
    "PHP (7.4.1)",
    "Prolog (GNU Prolog 1.4.5)",
    "Python (2.7.17)",
    "Python (3.8.1)",
    "R (4.0.0)",
    "Ruby (2.7.0)",
    "Rust (1.40.0)",
    "Scala (2.13.2)",
    "SQL (SQLite 3.27.2)",
    "Swift (5.2.3)",
    "TypeScript (3.7.4)",
    "Visual Basic.Net (vbnc 0.0.0.5943)",
];

describe("languageFamily", () => {
    test("strips the version suffix", () => {
        expect(languageFamily("C++ (GCC 9.2.0)")).toBe("C++");
        expect(languageFamily("F# (.NET Core SDK 3.1.202)")).toBe("F#");
        expect(languageFamily("Visual Basic.Net (vbnc 0.0.0.5943)")).toBe(
            "Visual Basic.Net",
        );
    });

    test("leaves names without a version alone", () => {
        expect(languageFamily("Brainfuck")).toBe("Brainfuck");
    });
});

describe("toLanguageConfig", () => {
    test.each(JUDGE0_LANGUAGE_NAMES)("%s has starter code", (name) => {
        const config = toLanguageConfig({ id: "1", name });
        expect(config.starterCode).not.toBe("");
    });

    test("unknown languages fall back to plain text with no starter", () => {
        expect(
            toLanguageConfig({ id: "999", name: "Brainfuck (2.0)" }),
        ).toEqual({
            id: "999",
            name: "Brainfuck (2.0)",
            monacoLang: "plaintext",
            starterCode: "",
            hasLsp: false,
        });
    });

    test("only Java, Python, C, and C++ have LSP", () => {
        const withLsp = JUDGE0_LANGUAGE_NAMES.filter(
            (name) => toLanguageConfig({ id: "1", name }).hasLsp,
        );
        expect(withLsp).toEqual([
            "C (Clang 7.0.1)",
            "C++ (Clang 7.0.1)",
            "C (GCC 7.4.0)",
            "C++ (GCC 7.4.0)",
            "C (GCC 8.3.0)",
            "C++ (GCC 8.3.0)",
            "C (GCC 9.2.0)",
            "C++ (GCC 9.2.0)",
            "Java (OpenJDK 13.0.1)",
            "Python (2.7.17)",
            "Python (3.8.1)",
        ]);
    });
});

describe("findLanguage", () => {
    const languages = [
        { id: "71", name: "Python (3.8.1)" },
        { id: DEFAULT_LANGUAGE_ID, name: "Java (OpenJDK 13.0.1)" },
    ].map(toLanguageConfig);

    test("finds by ID", () => {
        expect(findLanguage(languages, "71").name).toBe("Python (3.8.1)");
    });

    test("falls back to the default language", () => {
        expect(findLanguage(languages, "12345").id).toBe(DEFAULT_LANGUAGE_ID);
    });

    test("falls back to the first language when the default is missing", () => {
        expect(findLanguage(languages.slice(0, 1), "12345").id).toBe("71");
    });
});

describe("groupLanguages", () => {
    const languages = [
        "Java (OpenJDK 13.0.1)",
        "Rust (1.40.0)",
        "Python (3.8.1)",
        "Go (1.13.5)",
    ].map((name, i) => toLanguageConfig({ id: String(i), name }));

    test("lists LSP-supported languages first", () => {
        expect(
            groupLanguages(languages, "all").map((g) => [
                g.heading,
                g.languages.map((l) => l.name),
            ]),
        ).toEqual([
            ["LSP supported", ["Java (OpenJDK 13.0.1)", "Python (3.8.1)"]],
            ["Other languages", ["Rust (1.40.0)", "Go (1.13.5)"]],
        ]);
    });

    test("the LSP filter hides the other group", () => {
        expect(groupLanguages(languages, "lsp").map((g) => g.heading)).toEqual([
            "LSP supported",
        ]);
    });

    test("omits empty groups", () => {
        const noLsp = languages.filter((l) => !l.hasLsp);
        expect(groupLanguages(noLsp, "all").map((g) => g.heading)).toEqual([
            "Other languages",
        ]);
        expect(groupLanguages(noLsp, "lsp")).toEqual([]);
    });
});

describe("search", () => {
    // The picker's search is cmdk's; use its scorer so these match the UI.
    const matches = (name: string, query: string) => {
        const lang = toLanguageConfig({ id: "1", name });
        return defaultFilter(lang.name, query, searchKeywords(lang)) > 0;
    };

    test.each([
        ["C++ (GCC 9.2.0)", "cpp"],
        ["C# (Mono 6.6.0.161)", "csharp"],
        ["JavaScript (Node.js 12.14.0)", "js"],
        ["TypeScript (3.7.4)", "ts"],
        ["Python (3.8.1)", "py"],
        ["Go (1.13.5)", "golang"],
        ["Java (OpenJDK 13.0.1)", "java"],
        ["C (GCC 9.2.0)", "gcc"],
    ])("%s is found by %p", (name, query) => {
        expect(matches(name, query)).toBe(true);
    });

    test("unrelated languages are not", () => {
        expect(matches("Rust (1.40.0)", "cpp")).toBe(false);
        expect(matches("Haskell (GHC 8.8.1)", "python")).toBe(false);
    });

    test("every alias is keyed by a real language family", () => {
        const families = new Set(JUDGE0_LANGUAGE_NAMES.map(languageFamily));
        for (const family of Object.keys(SEARCH_ALIASES)) {
            expect(families).toContain(family);
        }
    });
});
