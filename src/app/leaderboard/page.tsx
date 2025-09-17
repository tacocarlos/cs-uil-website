import { db } from "~/server/db";
import { user } from "~/server/db/schema/auth";
import { submission } from "~/server/db/schema/submission";
import { eq } from "drizzle-orm";
import Leaderboard from "./leaderboard";

export default async function LeaderboardPage() {
    const users = await db
        .select()
        .from(user)
        .innerJoin(submission, eq(user.id, submission.userId))
        .where(eq(submission.accepted, true));
    const scores = new Map();
    users.forEach((score) => {
        const currUserScore = scores.get(score.user.name) ?? 0;
        scores.set(score.user.name, currUserScore + score.submission.points);
    });
    console.dir(scores);
    // TODO: ignore students who do not have leaderboard enabled
    return (
        <main className="bg-primary flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
            <Leaderboard
                scores={Object.entries(Object.fromEntries(scores)).map(
                    ([key, value]) => ({ name: key, score: value as number }),
                )}
            />
        </main>
    );
}
