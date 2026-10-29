import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "auth";
import { signInUrl } from "~/lib/auth/redirect-utils";
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

type Session = NonNullable<
    Awaited<ReturnType<typeof getCurrentMembership>>["session"]
>;

/**
 * The page being requested (the middleware's x-pathname header), or
 * `fallback` if it isn't known.
 */
export async function currentPathname(fallback: string): Promise<string> {
    return (await headers()).get("x-pathname") ?? fallback;
}

/**
 * Like getCurrentMembership, but sends signed-out visitors to sign in,
 * coming back to this page afterwards (or to `fallbackPath`, when the
 * page isn't known).
 */
export async function requireSession(fallbackPath: string): Promise<{
    session: Session;
    membership: ActiveMembership | null;
}> {
    const { session, membership } = await getCurrentMembership();
    if (!session) redirect(signInUrl(await currentPathname(fallbackPath)));
    return { session, membership };
}

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
