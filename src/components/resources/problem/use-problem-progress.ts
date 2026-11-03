import { api } from "~/trpc/react";

/**
 * The signed-in user's progress on every practice problem, keyed by
 * problem ID. All callers share one cached request. Submitting or running
 * code invalidates it, so it can stay cached a while.
 */
export function useProblemProgress() {
    return api.submission.getMyProblemProgress.useQuery(undefined, {
        staleTime: 5 * 60 * 1000,
    });
}
