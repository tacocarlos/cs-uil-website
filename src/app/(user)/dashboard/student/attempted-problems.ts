import type { Submission } from "~/server/db/schema/submission";
import type { ProblemProgress } from "~/lib/problems/status";

export type AttemptSort = "newest" | "oldest";

export type AttemptedProblem = {
    problemId: number;
    name: string;
    /** The latest submission, which wasn't accepted. */
    submission: Submission;
};

/**
 * Problems whose latest submission wasn't accepted, matching the problem
 * list's "Not yet accepted" status. Filtered to names containing `query`
 * (ignoring case) and sorted by that submission's time. Problems missing
 * from `names` (say, the problem API is down) are called "Problem #id".
 */
export function attemptedProblems(
    progress: Record<number, ProblemProgress>,
    names: ReadonlyMap<number, string>,
    { query = "", sort = "newest" }: { query?: string; sort?: AttemptSort },
): AttemptedProblem[] {
    const needle = query.trim().toLowerCase();
    const direction = sort === "newest" ? -1 : 1;

    return Object.entries(progress)
        .flatMap(([id, { submission }]) => {
            if (!submission || submission.accepted) return [];
            const problemId = Number(id);
            const name = names.get(problemId) ?? `Problem #${problemId}`;
            return [{ problemId, name, submission }];
        })
        .filter((p) => p.name.toLowerCase().includes(needle))
        .sort(
            (a, b) =>
                direction *
                (new Date(a.submission.timeSubmitted).getTime() -
                    new Date(b.submission.timeSubmitted).getTime()),
        );
}
