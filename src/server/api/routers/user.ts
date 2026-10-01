import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { db } from "~/server/db";
import { user as userTable } from "~/server/db/schema/auth";
import { eq } from "drizzle-orm";

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

    /** Opt in to (or out of) the leaderboards shared by all schools. */
    setGlobalLeaderboardVisibility: protectedProcedure
        .input(z.object({ visible: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const [updatedUser] = await db
                .update(userTable)
                .set({ showInGlobalLeaderboard: input.visible })
                .where(eq(userTable.id, ctx.user.id))
                .returning();
            return updatedUser;
        }),
});
