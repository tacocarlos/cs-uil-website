import { db } from "~/server/db";
import { user } from "~/server/db/schema/auth";
import { submission } from "~/server/db/schema/submission";
import { and, eq } from "drizzle-orm";
import { getAllCompetitions, getAllMinimalProblems } from "~/lib/api/lunaghs";
import {
    getCurrentMembership,
    leaderboardView,
} from "~/server/current-membership";
import { leaderboardVisibility } from "~/server/organizations";
import Leaderboard, { type CompetitionLeaderboardData } from "./leaderboard";
import { LeaderboardScopeTabs } from "./scope-tabs";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { membership } = await getCurrentMembership();
    const { scope, filter } = leaderboardView(await searchParams, membership);

    const [rows, apiProblems, apiCompetitions] = await Promise.all([
        db
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
            ),
        getAllMinimalProblems(),
        getAllCompetitions(),
    ]);

    console.log("api problem (initial):");
    console.dir(apiProblems);

    // Aggregate score and distinct solved problem IDs per user
    const userMap = new Map<
        string,
        { name: string; score: number; solvedIds: Set<number> }
    >();

    rows.forEach((row) => {
        const entry = userMap.get(row.user.id);
        if (
            row.submission.accepted === false ||
            row.submission.accepted === null
        )
            return;

        console.log(
            `Solved Problem:\n\t${JSON.stringify(row.submission, null, 4)}`,
        );
        if (entry) {
            entry.score += row.submission.points;
            entry.solvedIds.add(row.submission.problemId);
            console.log(
                `=================================\nUpdated Entry: \n\t${JSON.stringify(entry, null, 4)}\n${Array.from(entry.solvedIds)}\n=================================`,
            );
        } else {
            userMap.set(row.user.id, {
                name: row.user.name,
                score: row.submission.points,
                solvedIds: new Set([row.submission.problemId]),
            });
            const e = userMap.get(row.user.id)!;
            // e.solvedIds.add(row.submission.problemId);
            console.log(
                `=================================\nCreated Entry: \n\t${JSON.stringify(e, null, 4)}\n[${Array.from(e.solvedIds).toString()}]\n=================================`,
            );
        }
    });

    let scores = Array.from(userMap.entries()).map(([id, data]) => ({
        id,
        name: data.name,
        score: data.score,
        solvedProblemIds: Array.from(data.solvedIds),
    }));

    console.dir(scores);

    const problems = apiProblems.map((p) => ({
        id: p.id,
        name: p.name,
        competition_id: p.competition_id,
    }));
    const competitions = new Map<number, CompetitionLeaderboardData>();
    apiCompetitions.forEach((c) => competitions.set(c.id, c));
    console.log("api problems: ");
    console.dir(apiProblems);
    return (
        <main className="bg-primary flex min-h-screen flex-col items-center justify-center px-4 pt-24 pb-12 sm:px-6 lg:px-8">
            <LeaderboardScopeTabs
                path="/leaderboard"
                scope={scope}
                filter={filter}
                hasSchool={membership !== null}
            />
            <Leaderboard
                scores={scores}
                problems={problems}
                competitions={competitions}
            />
        </main>
    );
}
