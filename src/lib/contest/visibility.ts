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
        label: "Host school only",
        description: "Only the host school's students can see and join it.",
    },
    invite: {
        label: "Host and invited schools",
        description:
            "The host school and the schools it invites can see and join it. Invited schools' teachers can decline.",
    },
    open: {
        label: "Global (every school)",
        description:
            "A site-wide contest with no host school: anyone can see it, and any signed-in student can join. Only site admins create these.",
    },
};

/** Visibilities for contests hosted by a school (everything but global). */
export const SCHOOL_CONTEST_VISIBILITIES = CONTEST_VISIBILITIES.filter(
    (v) => v !== "open",
);
