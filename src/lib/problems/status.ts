import type { Submission } from "~/server/db/schema/submission";

/** A user's progress on one practice problem. */
export type ProblemProgress = {
    /** Their latest submission, or null if they haven't submitted. */
    submission: Submission | null;
    /** They've run code on it, whether or not they submitted. */
    started: boolean;
};

export const PROBLEM_STATUSES = [
    "accepted",
    "not-accepted",
    "started",
    "not-attempted",
] as const;

export type ProblemStatus = (typeof PROBLEM_STATUSES)[number];

export const PROBLEM_STATUS_LABELS: Record<ProblemStatus, string> = {
    accepted: "Accepted",
    "not-accepted": "Not yet accepted",
    started: "Started, no submission",
    "not-attempted": "Not attempted",
};

/** The status a problem shows; no progress means not attempted. */
export function problemStatus(progress?: ProblemProgress): ProblemStatus {
    if (progress?.submission) {
        return progress.submission.accepted ? "accepted" : "not-accepted";
    }
    return progress?.started ? "started" : "not-attempted";
}
