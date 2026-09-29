import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "auth";
import {
    getActiveMembership,
    type ActiveMembership,
    type LeaderboardScope,
} from "~/server/organizations";

/**
 * The current request's session and active-school membership, for server
 * components. Cached per request, so a layout and its page share one lookup.
 */
export const getCurrentMembership = cache(
    async (): Promise<{
        session: Awaited<ReturnType<typeof auth.api.getSession>>;
        membership: ActiveMembership | null;
    }> => {
        const session = await auth.api.getSession({ headers: await headers() });
        const membership = session ? await getActiveMembership(session) : null;
        return { session, membership };
    },
);

/**
 * Leaderboard pages show the viewer's school unless `?view=global` is set.
 * Visitors without a school (e.g. signed out) always see the global one.
 */
export function leaderboardScope(
    view: string | string[] | undefined,
    membership: ActiveMembership | null,
): LeaderboardScope {
    return view === "global" || !membership ? "global" : "school";
}
