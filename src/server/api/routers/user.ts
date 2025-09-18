import { createTRPCRouter } from "~/server/api/trpc";
import { z } from "zod";
import { db } from "~/server/db";
import { user as userTable } from "~/server/db/schema/auth";
import { eq } from "drizzle-orm";
import { publicProcedure } from "../trpc";

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

    toggleLeaderboardVisibility: publicProcedure
        .input(z.object({ userId: z.string(), currentVisibility: z.boolean() }))
        .mutation(async (opts) => {
            const { userId, currentVisibility } = opts.input;
            const updatedUsers = await db
                .update(userTable)
                .set({ showScoresInLeaderboard: !currentVisibility })
                .where(eq(userTable.id, userId))
                .returning();
            return updatedUsers[0];
        }),
});
