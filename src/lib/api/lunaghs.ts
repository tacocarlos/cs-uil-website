/**
 * The app's access to https://api.lunaghs.dev, through the
 * @tacocarlos/luna-cs-uil SDK.
 *
 * Wraps the SDK with Next.js caching and the app's error handling (lists
 * come back empty and lookups null when the API is unavailable), and
 * converts API problems into the app-level Problem shape used by the UI.
 */

import {
    LunaCsUilClient,
    type Competition,
    type Problem as ApiProblem,
    type ShortProblem,
} from "@tacocarlos/luna-cs-uil";
import type { CompetitionLevel } from "~/lib/problems/competition-levels";
import type { Problem } from "~/server/db/schema/types";

export type { ApiProblem, Competition, ShortProblem };

/** Tag applied to every fetch so the entire problem API cache can be
 * invalidated on demand via `revalidateTag(LUNAGHS_CACHE_TAG)`. */
export const LUNAGHS_CACHE_TAG = "lunaghs-problems-api";

/**
 * Revalidate every hour so the site stays fresh without hammering the API
 * on every request. (Next.js adds `next` to RequestInit.)
 */
const CACHE_OPTS: RequestInit = {
    next: { revalidate: 3600, tags: [LUNAGHS_CACHE_TAG] },
};

// Looks up the global fetch on each call, so tests can stub it.
const cachedFetch = (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, { ...init, ...CACHE_OPTS });

// The cast only drops extras some runtimes add to fetch's type (Bun's
// `preconnect`), which the SDK doesn't use.
const client = new LunaCsUilClient({ fetch: cachedFetch as typeof fetch });

/** `request`'s result, or `fallback` if it fails. */
async function orElse<T, F>(request: Promise<T>, fallback: F) {
    try {
        return await request;
    } catch {
        return fallback;
    }
}

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

export function getAllMinimalProblems(): Promise<ShortProblem[]> {
    return orElse(client.problems.getAllProblems(), []);
}

/**
 * The full problem, with the reference solution and hidden test URLs, so
 * server-side only. Returns null if the problem doesn't exist (404) or the
 * request fails.
 */
export function getProblemById(id: number): Promise<ApiProblem | null> {
    return orElse(client.problems.getProblemById({ id }), null);
}

/** The statement as markdown, with figure links resolved to their images. */
export function getProblemMarkdown(id: number): Promise<string | null> {
    return orElse(client.getProblemStatement(id), null);
}

export function getAllCompetitions(): Promise<Competition[]> {
    return orElse(client.competitions.getAllCompetitions(), []);
}

export function getCompetitionProblems(
    competitionId: number,
): Promise<ApiProblem[]> {
    return orElse(
        client.competitions.getCompetitionProblems({ id: competitionId }),
        [],
    );
}

/** Returns null if the competition doesn't exist or the request fails. */
export function getCompetitionById(
    competitionId: number,
): Promise<Competition | null> {
    return orElse(
        client.competitions.getCompetitionById({ id: competitionId }),
        null,
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// App-level mapping helpers
// ─────────────────────────────────────────────────────────────────────────────

/** A competition's level; competitions without one count as custom. */
export function competitionLevel(competition: Competition): CompetitionLevel {
    return competition.level ?? "custom";
}

/**
 * Converts a raw API problem + its parent competition into the shape used
 * throughout the app (mirrors the old Drizzle `Problem` type).
 *
 * Fetches markdown, student sample data, and sample output in parallel.
 * Leaves out the solution and hidden test data, which only grading reads
 * (server-side, from the ApiProblem).
 */
export async function toAppProblem(
    apiProblem: ApiProblem,
    competition: Competition,
): Promise<Problem> {
    const [markdown, defaultInput, sampleOutput] = await Promise.all([
        getProblemMarkdown(apiProblem.id),
        fetchUrlContent(apiProblem.studentDataUrl),
        fetchUrlContent(apiProblem.studentOutputUrl),
    ]);

    return {
        id: apiProblem.id,
        problemName: apiProblem.name,
        competitionYear: competition.year,
        competitionLevel: competitionLevel(competition),
        problemText: markdown ?? "",
        programName: "",
        sampleOutput,
        inputFileName: filenameFromUrl(apiProblem.studentDataUrl),
        defaultInputFile: defaultInput || null,
        enabled: true,
    };
}

/**
 * The app-level problem with this ID, or null if the problem or its
 * competition can't be found.
 */
export async function getAppProblem(id: number): Promise<Problem | null> {
    const apiProblem = await getProblemById(id);
    if (!apiProblem) return null;
    const competition = await getCompetitionById(apiProblem.competition);
    if (!competition) return null;
    return toAppProblem(apiProblem, competition);
}

/**
 * An API problem without the reference solution or hidden test data, safe
 * to send to browsers. Only server-side grading may see the full problem.
 * Built from an allow-list, so fields the API adds later stay private.
 */
export type PublicApiProblem = Pick<
    ApiProblem,
    | "id"
    | "competition"
    | "createdAt"
    | "updatedAt"
    | "name"
    | "number"
    | "problemTextUrl"
    | "studentDataUrl"
    | "studentOutputUrl"
>;

export function toPublicProblem(problem: ApiProblem): PublicApiProblem {
    return {
        id: problem.id,
        competition: problem.competition,
        createdAt: problem.createdAt,
        updatedAt: problem.updatedAt,
        name: problem.name,
        number: problem.number,
        problemTextUrl: problem.problemTextUrl,
        studentDataUrl: problem.studentDataUrl,
        studentOutputUrl: problem.studentOutputUrl,
    };
}

/**
 * Fetches every competition and all of its problems (with full content),
 * then returns a flat list of app-level Problem objects.
 *
 * Results are sorted by competition year descending, then by problem number
 * ascending within each competition.
 */
export async function getAllAppProblems(): Promise<Problem[]> {
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
