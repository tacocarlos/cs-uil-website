import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "auth";
import { parseSchoolFilter, type SchoolFilter } from "~/lib/schools";
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

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * A leaderboard page's scope plus, on the global view, its school filter
 * (?conference=&region=&district=).
 */
export function leaderboardView(
    searchParams: SearchParams,
    membership: ActiveMembership | null,
): { scope: LeaderboardScope; filter: SchoolFilter } {
    const scope = leaderboardScope(searchParams.view, membership);
    return {
        scope,
        filter: scope === "global" ? parseSchoolFilter(searchParams) : {},
    };
}
