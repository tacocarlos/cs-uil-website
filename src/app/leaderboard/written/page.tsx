import {
    getCurrentMembership,
    leaderboardView,
} from "~/server/current-membership";
import { LeaderboardScopeTabs } from "../scope-tabs";
import WrittenLeaderboard from "./written-leaderboard";

export const dynamic = "force-dynamic";

export default async function WrittenLeaderboardPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { membership } = await getCurrentMembership();
    const { scope, filter } = leaderboardView(await searchParams, membership);

    return (
        <main className="bg-primary flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
            <LeaderboardScopeTabs
                path="/leaderboard/written"
                scope={scope}
                filter={filter}
                hasSchool={membership !== null}
            />
            {/* Keyed so switching scope resets the year/competition picks. */}
            <WrittenLeaderboard key={scope} scope={scope} filter={filter} />
        </main>
    );
}
