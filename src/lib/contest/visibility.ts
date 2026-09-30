/**
 * Who can see and enroll in a contest (enforced in src/server/contests.ts).
 * Kept free of server imports so client components can use it.
 */
export const CONTEST_VISIBILITIES = ["school", "invite", "open"] as const;
export type ContestVisibility = (typeof CONTEST_VISIBILITIES)[number];

/** How each contest visibility is described to users. */
export const VISIBILITY_LABELS: Record<
    ContestVisibility,
    { label: string; description: string }
> = {
    school: {
        label: "Your school only",
        description: "Only your school's students can see and join it.",
    },
    invite: {
        label: "Invited schools",
        description:
            "Your school and the schools you invite can see and join it.",
    },
    open: {
        label: "Open to everyone",
        description:
            "Anyone can see it, and any signed-in student can join. The leaderboard shows each student's school.",
    },
};
