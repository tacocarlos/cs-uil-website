import { db } from "~/server/db";
import { user } from "~/server/db/schema/auth";
import { submission } from "~/server/db/schema/submission";
import { and, eq } from "drizzle-orm";
import {
    getCurrentMembership,
    leaderboardView,
} from "~/server/current-membership";
import {
    leaderboardVisibility,
    schoolNamesByUser,
} from "~/server/organizations";
import Leaderboard from "./leaderboard";
import { LeaderboardKindTabs } from "./kind-tabs";
import { LeaderboardScopeTabs } from "./scope-tabs";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { membership } = await getCurrentMembership();
    const { scope, filter } = leaderboardView(await searchParams, membership);

    const rows = await db
        .select()
        .from(user)
        .innerJoin(submission, eq(user.id, submission.userId))
        .where(
            and(
                leaderboardVisibility(
                    scope,
                    membership?.organizationId ?? null,
                    filter,
                ),
                eq(submission.accepted, true),
            ),
        );

    // Aggregate score per user (the query only returns accepted
    // submissions). Which problems they solved stays on the server.
    const userMap = new Map<string, { name: string; score: number }>();

    rows.forEach((row) => {
        const entry = userMap.get(row.user.id);
        if (entry) {
            entry.score += row.submission.points;
        } else {
            userMap.set(row.user.id, {
                name: row.user.name,
                score: row.submission.points,
            });
        }
    });

    // On the shared leaderboard, say which school each student is from.
    const schoolNames =
        scope === "global"
            ? await schoolNamesByUser(Array.from(userMap.keys()))
            : null;

    const scores = Array.from(userMap.entries()).map(([id, data]) => ({
        id,
        name: data.name,
        score: data.score,
        schools: schoolNames?.get(id) ?? [],
    }));

    return (
        <main className="bg-primary flex min-h-screen flex-col items-center justify-center px-4 pt-24 pb-12 sm:px-6 lg:px-8">
            <LeaderboardKindTabs path="/leaderboard" />
            <LeaderboardScopeTabs
                path="/leaderboard"
                scope={scope}
                filter={filter}
                hasSchool={membership !== null}
            />
            <Leaderboard scores={scores} showSchools={scope === "global"} />
        </main>
    );
}
