import {
    getCurrentMembership,
    leaderboardScope,
} from "~/server/current-membership";
import { LeaderboardScopeTabs } from "../scope-tabs";
import WrittenLeaderboard from "./written-leaderboard";

export const dynamic = "force-dynamic";

export default async function WrittenLeaderboardPage({
    searchParams,
}: {
    searchParams: Promise<{ view?: string | string[] }>;
}) {
    const { membership } = await getCurrentMembership();
    const scope = leaderboardScope((await searchParams).view, membership);

    return (
        <main className="bg-primary flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
            <LeaderboardScopeTabs
                path="/leaderboard/written"
                scope={scope}
                hasSchool={membership !== null}
            />
            {/* Keyed so switching scope resets the year/competition picks. */}
            <WrittenLeaderboard key={scope} scope={scope} />
        </main>
    );
}
