import type { ContestStatus } from "~/server/db/schema/contest";

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
