import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { db } from "~/server/db";
import { user as userTable } from "~/server/db/schema/auth";
import { eq, and } from "drizzle-orm";
import { submission } from "~/server/db/schema/submission";

// Everything here is about the signed-in user; there's no way to read or
// change another user's account.
export const userRouter = createTRPCRouter({
    getMe: protectedProcedure.query(async ({ ctx }) => {
        const [user] = await db
            .select()
            .from(userTable)
            .limit(1)
            .where(eq(userTable.id, ctx.user.id));
        return user;
    }),

    getUserLeaderboardVisibility: protectedProcedure.query(async ({ ctx }) => {
        const [user] = await db
            .select({ visible: userTable.showScoresInLeaderboard })
            .from(userTable)
            .limit(1)
            .where(eq(userTable.id, ctx.user.id));
        return user?.visible;
    }),

    toggleLeaderboardVisibility: protectedProcedure
        .input(z.object({ currentVisibility: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const [updatedUser] = await db
                .update(userTable)
                .set({ showScoresInLeaderboard: !input.currentVisibility })
                .where(eq(userTable.id, ctx.user.id))
                .returning();
            return updatedUser;
        }),

    getProblemSubmissions: protectedProcedure
        .input(z.object({ problemId: z.number().int().optional() }))
        .query(async ({ ctx, input }) => {
            const mine = eq(submission.userId, ctx.user.id);
            if (input.problemId === undefined) {
                return db.select().from(submission).where(mine);
            }
            return db
                .select()
                .from(submission)
                .where(and(mine, eq(submission.problemId, input.problemId)));
        }),
});
