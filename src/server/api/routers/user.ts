import { createTRPCRouter } from "~/server/api/trpc";
import { z } from "zod";
import { db } from "~/server/db";
import { user as userTable } from "~/server/db/schema/auth";
import { eq, and } from "drizzle-orm";
import { publicProcedure } from "../trpc";
import { submission } from "~/server/db/schema/submission";

export const userRouter = createTRPCRouter({
    getUser: publicProcedure
        .input(z.object({ userId: z.string() }))
        .query(async (opts) => {
            const { userId } = opts.input;
            const [user] = await db
                .select()
                .from(userTable)
                .limit(1)
                .where(eq(userTable.id, userId));
            return user;
        }),

    getUserLeaderboardVisibility: publicProcedure
        .input(z.object({ userId: z.string() }))
        .query(async (opts) => {
            const { userId } = opts.input;
            const [user] = await db
                .select()
                .from(userTable)
                .limit(1)
                .where(eq(userTable.id, userId));
            return user?.showScoresInLeaderboard;
        }),

    toggleLeaderboardVisibility: publicProcedure
        .input(z.object({ userId: z.string(), currentVisibility: z.boolean() }))
        .mutation(async (opts) => {
            const { userId, currentVisibility } = opts.input;
            const [updatedUsers] = await db
                .update(userTable)
                .set({ showScoresInLeaderboard: !currentVisibility })
                .where(eq(userTable.id, userId))
                .returning();
            console.log(
                `Updated User [${currentVisibility} -> ${!currentVisibility}]:`,
            );
            console.dir(updatedUsers);
            return updatedUsers;
        }),

    getProblemSubmissions: publicProcedure
        .input(
            z.object({
                userId: z.string(),
                problemId: z.number().int().optional(),
            }),
        )
        .query(async (opts) => {
            const { userId, problemId } = opts.input;
            const sameUser = eq(submission.userId, userId);
            if (problemId === undefined) {
                return db.select().from(submission).where(sameUser);
            } else {
                const sameProblem = eq(submission.problemId, problemId);
                return db
                    .select()
                    .from(submission)
                    .where(and(sameUser, sameProblem));
            }
        }),
});
