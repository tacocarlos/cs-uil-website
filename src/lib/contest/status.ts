/**
 * A contest's lifecycle, in order: draft → scheduled → active → frozen →
 * ended. The single source of truth for the `contest.status` column and
 * the rules below. Kept free of server imports so client components can
 * use it.
 */
export const CONTEST_STATUSES = [
    "draft",
    "scheduled",
    "active",
    "frozen",
    "ended",
] as const;
export type ContestStatus = (typeof CONTEST_STATUSES)[number];

/**
 * The statuses a contest manager may move a contest to from each (current,
 * effective) status; nothing goes back to draft. Contests also start and
 * end on their own (below).
 */
export const STATUS_TRANSITIONS: Record<
    ContestStatus,
    readonly Exclude<ContestStatus, "draft">[]
> = {
    draft: ["scheduled"],
    scheduled: ["active"],
    active: ["frozen", "ended"],
    frozen: ["ended"],
    ended: [],
};

export function canTransition(from: ContestStatus, to: ContestStatus) {
    return (STATUS_TRANSITIONS[from] as readonly ContestStatus[]).includes(to);
}

/** Whether the contest is running: started and not yet ended. */
export function isInProgress(status: ContestStatus) {
    return status === "active" || status === "frozen";
}

/** Whether students may enroll: until the leaderboard freezes. */
export function isEnrollable(status: ContestStatus) {
    return status === "scheduled" || status === "active";
}

type Timed = { status: ContestStatus; startsAt: Date; endsAt: Date };

/**
 * A contest's status at `now`, from its stored status and schedule:
 * scheduled contests start at `startsAt`, and every published contest ends
 * at `endsAt`. What teachers set by hand still applies: drafts stay drafts
 * (unpublished), a contest started early or frozen stays so until its end,
 * and one ended early stays ended. Pushing `endsAt` back reopens a contest
 * that ran out of time.
 */
export function effectiveStatus(
    contest: Timed,
    now: Date = new Date(),
): ContestStatus {
    const { status } = contest;
    if (status === "draft" || status === "ended") return status;
    if (now >= contest.endsAt) return "ended";
    if (status === "scheduled" && now >= contest.startsAt) return "active";
    return status;
}

/** The row with `status` replaced by its status at `now`. */
export function withEffectiveStatus<T extends Timed>(
    contest: T,
    now: Date = new Date(),
): T {
    return { ...contest, status: effectiveStatus(contest, now) };
}
