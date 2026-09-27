import { env } from "~/env";
import { judge0ResultSchema, type Judge0Result } from "./judge0-result";

export { judge0ResultSchema, type Judge0Result };

// All HTTP calls to Judge0 go through this module so the browser never talks
// to Judge0 directly (avoids CORS).

/** Runs `code` on Judge0 with `stdin` and waits for it to finish. */
export async function runOnJudge0(
    code: string,
    languageId: string,
    stdin = "",
): Promise<Judge0Result> {
    // `wait=true` makes Judge0 respond with the finished submission, so no
    // follow-up GET by token is needed.
    const res = await fetch(`${env.JUDGE_URL}/submissions?wait=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            source_code: code,
            language_id: languageId,
            stdin,
        }),
    });
    if (!res.ok) {
        throw new Error(
            `Judge0 submission failed (${res.status}): ${await res.text()}`,
        );
    }
    return judge0ResultSchema.parse(await res.json());
}

export type Judge0Worker = {
    queue: string;
    size: number;
    available: number;
    idle: number;
    working: number;
    paused: number;
    failed: number;
};

export type Judge0Status = {
    online: boolean;
    about: { version: string } | null;
    workers: Judge0Worker[] | null;
    stats: { submissions: { total: number; today: number } } | null;
};

/** Live status from /about, /workers, and /statistics. Never throws. */
export async function fetchJudge0Status(): Promise<Judge0Status> {
    // Endpoints that respond with an error are reported as null.
    const getJson = async <T>(path: string): Promise<T | null> => {
        const res = await fetch(`${env.JUDGE_URL}${path}`, {
            cache: "no-store",
        });
        return res.ok ? ((await res.json()) as T) : null;
    };

    try {
        const [about, workers, stats] = await Promise.all([
            getJson<Judge0Status["about"]>("/about"),
            getJson<Judge0Status["workers"]>("/workers"),
            getJson<Judge0Status["stats"]>("/statistics"),
        ]);
        return { online: true, about, workers, stats };
    } catch {
        return { online: false, about: null, workers: null, stats: null };
    }
}

/**
 * Judge0 languages that can't be written in the editor: "Plain Text" (43),
 * "Executable" (44, a prebuilt binary), and "Multi-file program" (89, a zip).
 */
const NON_EDITOR_LANGUAGE_IDS = new Set([43, 44, 89]);

/**
 * Languages installed on the Judge0 instance that can be written in the
 * editor. IDs are returned as strings, matching how the app stores them.
 * Cached for an hour, since the list only changes when Judge0 is upgraded.
 */
export async function fetchJudge0Languages(): Promise<
    { id: string; name: string }[]
> {
    const res = await fetch(`${env.JUDGE_URL}/languages`, {
        next: { revalidate: 3600 },
    });
    if (!res.ok) {
        throw new Error(`Judge0 /languages failed (${res.status})`);
    }
    const languages = (await res.json()) as { id: number; name: string }[];
    return languages
        .filter((l) => !NON_EDITOR_LANGUAGE_IDS.has(l.id))
        .map((l) => ({ id: String(l.id), name: l.name }));
}
