/**
 * API client for https://api.lunaghs.dev
 *
 * Provides typed wrappers around every endpoint and a helper that converts
 * API responses into the app-level Problem shape used throughout the UI.
 */

const API_BASE = "https://api.lunaghs.dev";

// ─────────────────────────────────────────────────────────────────────────────
// API response types
// ─────────────────────────────────────────────────────────────────────────────

export type CompetitionLevel =
    | "invA"
    | "invB"
    | "district"
    | "state"
    | "region"
    | "custom";

export interface ApiMinimalProblem {
    id: number;
    competition_id: number;
    name: string;
    number: number;
}

export interface ApiProblem {
    id: number;
    competition: number;
    createdAt: string | null;
    updatedAt: string | null;
    name: string;
    number: number;
    problem_text_url: string | null;
    student_data_url: string | null;
    student_output_url: string | null;
    test_data_url: string | null;
    test_output_url: string | null;
    solution: string;
}

export interface ApiCompetition {
    id: number;
    createdAt: string | null;
    updatedAt: string | null;
    level: CompetitionLevel;
    year: number;
    student_packet_url: string;
    data_zip_url: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Low-level fetch helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shared Next.js cache options – revalidate every hour so the site stays fresh
 * without hammering the API on every request.
 *
 * Next.js augments the global RequestInit with a `next` property, so this is
 * well-typed when the project includes `/// <reference types="next" />`.
 */
/** Tag applied to every fetch so the entire problem API cache can be
 * invalidated on demand via `revalidateTag(LUNAGHS_CACHE_TAG)`. */
export const LUNAGHS_CACHE_TAG = "lunaghs-problems-api";

const CACHE_OPTS: RequestInit = {
    next: { revalidate: 3600, tags: [LUNAGHS_CACHE_TAG] },
};

/**
 * Safely fetch the text content at a URL.
 * Returns an empty string on any error or if the URL is null/undefined.
 */
export async function fetchUrlContent(
    url: string | null | undefined,
): Promise<string> {
    if (!url) return "";
    try {
        const res = await fetch(url, CACHE_OPTS);
        if (!res.ok) return "";
        return res.text();
    } catch {
        return "";
    }
}

/** Extract the filename from the end of a URL path, or return null. */
function filenameFromUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    try {
        const pathname = new URL(url).pathname;
        return pathname.split("/").pop() ?? null;
    } catch {
        // Fall back to simple string split for non-standard URLs
        return url.split("/").pop() ?? null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// API endpoint wrappers
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllMinimalProblems(): Promise<ApiMinimalProblem[]> {
    try {
        const res = await fetch(`${API_BASE}/api/problems/`, CACHE_OPTS);
        if (!res.ok) return [];
        return (await res.json()) as ApiMinimalProblem[];
    } catch {
        return [];
    }
}

export async function getProblemById(
    id: number,
): Promise<{ success: boolean; problem: ApiProblem | null }> {
    try {
        const res = await fetch(`${API_BASE}/api/problems/${id}`, CACHE_OPTS);
        if (!res.ok) return { success: false, problem: null };
        return (await res.json()) as {
            success: boolean;
            problem: ApiProblem | null;
        };
    } catch {
        return { success: false, problem: null };
    }
}

export async function getProblemMarkdown(id: number): Promise<string | null> {
    try {
        const res = await fetch(
            `${API_BASE}/api/problems/${id}/markdown`,
            CACHE_OPTS,
        );
        if (!res.ok) return null;
        const data = (await res.json()) as { markdown: string | null };
        return data.markdown ?? null;
    } catch {
        return null;
    }
}

export async function getAllCompetitions(): Promise<ApiCompetition[]> {
    try {
        const res = await fetch(`${API_BASE}/api/competition/`, CACHE_OPTS);
        if (!res.ok) return [];
        return (await res.json()) as ApiCompetition[];
    } catch {
        return [];
    }
}

export async function getCompetitionProblems(
    competitionId: number,
): Promise<ApiProblem[]> {
    try {
        const res = await fetch(
            `${API_BASE}/api/competition/${competitionId}/problems`,
            CACHE_OPTS,
        );
        if (!res.ok) return [];
        return (await res.json()) as ApiProblem[];
    } catch {
        return [];
    }
}

export async function getCompetitionById(
    competitionId: number,
): Promise<ApiCompetition | undefined> {
    try {
        const res = await fetch(
            `${API_BASE}/api/competition/${competitionId}`,
            CACHE_OPTS,
        );
        if (!res.ok) return undefined;

        return (await res.json()) as ApiCompetition;
    } catch {
        return undefined;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// App-level mapping helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts a raw API problem + its parent competition into the shape used
 * throughout the app (mirrors the old Drizzle `Problem` type).
 *
 * Fetches markdown, student sample data, and sample output in parallel.
 *
 * `testInput` and `testOutput` are intentionally left empty here – callers
 * that need them for grading should use `fetchUrlContent` directly with
 * `apiProblem.test_data_url` / `apiProblem.test_output_url`.
 */
export async function toAppProblem(
    apiProblem: ApiProblem,
    competition: ApiCompetition,
) {
    const [markdown, defaultInput, sampleOutput] = await Promise.all([
        getProblemMarkdown(apiProblem.id),
        fetchUrlContent(apiProblem.student_data_url),
        fetchUrlContent(apiProblem.student_output_url),
    ]);

    return {
        id: apiProblem.id,
        problemName: apiProblem.name,
        competitionYear: competition.year,
        competitionLevel: competition.level ?? "custom",
        problemText: markdown ?? "",
        programName: "",
        sampleOutput,
        inputFileName: filenameFromUrl(apiProblem.student_data_url),
        defaultInputFile: defaultInput || null,
        enabled: true,
        solutionCode: apiProblem.solution,
        testInput: "",
        testOutput: "",
    };
}

/**
 * Fetches every competition and all of its problems (with full content),
 * then returns a flat list of app-level Problem objects.
 *
 * Results are sorted by competition year descending, then by problem number
 * ascending within each competition.
 */
export async function getAllAppProblems() {
    const competitions = await getAllCompetitions();
    if (competitions.length === 0) return [];

    // Fetch every competition's full problem list in parallel
    const nestedApiProblems = await Promise.all(
        competitions.map((c) => getCompetitionProblems(c.id)),
    );

    // Flatten to {apiProblem, competition} pairs
    const pairs = nestedApiProblems.flatMap((probs, idx) =>
        probs.map((p) => ({ apiProblem: p, comp: competitions[idx]! })),
    );

    // Sort before converting: newest competition first, then by problem number
    pairs.sort(
        (a, b) =>
            b.comp.year - a.comp.year ||
            a.apiProblem.number - b.apiProblem.number,
    );

    // Fetch all content in parallel – Promise.all preserves order
    return Promise.all(
        pairs.map(({ apiProblem, comp }) => toAppProblem(apiProblem, comp)),
    );
}
