import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { db } from "~/server/db";
import { writtenTests } from "~/server/db/schema/written";
import { user } from "~/server/db/schema/auth";
import { eq, and, desc, isNotNull } from "drizzle-orm";

export const writtenRouter = createTRPCRouter({
    getLeaderboard: publicProcedure
        .input(
            z.object({
                competition: z
                    .enum([
                        "VCM-1",
                        "VCM-2",
                        "VCM-3",
                        "VCM-4",
                        "invA",
                        "invB",
                        "district",
                        "region",
                        "state",
                    ])
                    .optional(),
            }),
        )
        .query(async (opts) => {
            const { competition } = opts.input;

            // Build where conditions
            const conditions = [eq(user.showScoresInLeaderboard, true)];
            if (competition) {
                conditions.push(eq(writtenTests.competition, competition));
            }

            // Get written test scores for users who want to show their scores
            const tests = await db
                .select({
                    userId: user.id,
                    userName: user.name,
                    score: writtenTests.score,
                    competition: writtenTests.competition,
                    takenAt: writtenTests.takenAt,
                    accuracy: writtenTests.accuracy,
                })
                .from(writtenTests)
                .innerJoin(user, eq(writtenTests.userId, user.id))
                .where(and(...conditions));

            // Aggregate scores by user
            const scoreMap = new Map<
                string,
                { name: string; totalScore: number }
            >();

            tests.forEach((test) => {
                const current = scoreMap.get(test.userId);
                if (current) {
                    scoreMap.set(test.userId, {
                        name: current.name,
                        totalScore: current.totalScore + test.score,
                    });
                } else {
                    scoreMap.set(test.userId, {
                        name: test.userName,
                        totalScore: test.score,
                    });
                }
            });

            // Convert to array and sort by score descending
            return Array.from(scoreMap.entries())
                .map(([id, data]) => ({
                    id,
                    name: data.name,
                    score: data.totalScore,
                }))
                .sort((a, b) => b.score - a.score);
        }),

    getAvailableCompetitions: publicProcedure.query(async () => {
        // Get all distinct competitions that have scores
        const competitions = await db
            .selectDistinct({
                competition: writtenTests.competition,
            })
            .from(writtenTests)
            .innerJoin(user, eq(writtenTests.userId, user.id))
            .where(
                and(
                    eq(user.showScoresInLeaderboard, true),
                    isNotNull(writtenTests.competition),
                ),
            );

        return competitions
            .map((c) => c.competition)
            .filter((c) => c !== null)
            .sort();
    }),

    getMostRecentCompetition: publicProcedure.query(async () => {
        // Get the competition with the most recent score
        const mostRecent = await db
            .select({
                competition: writtenTests.competition,
                takenAt: writtenTests.takenAt,
            })
            .from(writtenTests)
            .innerJoin(user, eq(writtenTests.userId, user.id))
            .where(
                and(
                    eq(user.showScoresInLeaderboard, true),
                    isNotNull(writtenTests.competition),
                ),
            )
            .orderBy(desc(writtenTests.takenAt))
            .limit(1);

        return mostRecent[0]?.competition ?? null;
    }),
});
