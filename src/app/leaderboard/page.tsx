import { db } from "~/server/db";
import { user } from "~/server/db/schema/auth";
import { submission } from "~/server/db/schema/submission";
import { and, eq } from "drizzle-orm";
import Leaderboard from "./leaderboard";

export default async function LeaderboardPage() {
    const users = await db
        .select()
        .from(user)
        .innerJoin(submission, eq(user.id, submission.userId))
        .where(
            and(
                eq(submission.isStudentVisible, true),
                eq(submission.accepted, true),
            ),
        );

    const scores = new Map<string, { name: string; score: number }>();
    users.forEach((score) => {
        const currUserScore = scores.get(score.user.id)?.score ?? 0;
        scores.set(score.user.id, {
            name: score.user.name,
            score: currUserScore + score.submission.points,
        });
    });

    console.dir(scores);

    return (
        <main className="bg-primary flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
            <Leaderboard
                scores={Object.entries(Object.fromEntries(scores)).map(
                    ([key, value]) => ({
                        id: key,
                        name: value.name,
                        score: value.score as number,
                    }),
                )}
            />
        </main>
    );
}
