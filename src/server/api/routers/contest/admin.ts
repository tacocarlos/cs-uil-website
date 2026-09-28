import z from "zod";
import { eq } from "drizzle-orm";
import { teacherProcedure } from "../../trpc";
import { db } from "~/server/db";
import { contest, contestProblem } from "~/server/db/schema/contest";

const scoringMode = z.enum(contest.scoringMode.enumValues);

/** Creating and editing contests and their problem lists (teacher tools). */
export const contestAdmin = {
    create: teacherProcedure
        .input(
            z.object({
                name: z.string().min(1),
                description: z.string().default(""),
                startsAt: z.string(),
                endsAt: z.string(),
                scoringMode,
                penaltyPoints: z.number().int().min(0).optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const [row] = await db
                .insert(contest)
                .values({
                    ...input,
                    startsAt: new Date(input.startsAt),
                    endsAt: new Date(input.endsAt),
                    createdBy: ctx.user.id,
                })
                .returning();
            return row!;
        }),

    update: teacherProcedure
        .input(
            z.object({
                contestId: z.number().int(),
                name: z.string().min(1).optional(),
                description: z.string().optional(),
                startsAt: z.string().optional(),
                endsAt: z.string().optional(),
                scoringMode: scoringMode.optional(),
                penaltyPoints: z.number().int().min(0).optional(),
            }),
        )
        .mutation(async ({ input }) => {
            const { contestId, startsAt, endsAt, ...rest } = input;
            // Drizzle skips undefined values in `.set()`, so omitted fields
            // are left unchanged.
            const changes = {
                ...rest,
                startsAt: startsAt ? new Date(startsAt) : undefined,
                endsAt: endsAt ? new Date(endsAt) : undefined,
            };
            if (Object.values(changes).every((v) => v === undefined)) {
                return null;
            }

            const [row] = await db
                .update(contest)
                .set(changes)
                .where(eq(contest.id, contestId))
                .returning();
            return row ?? null;
        }),

    setStatus: teacherProcedure
        .input(
            z.object({
                contestId: z.number().int(),
                status: z.enum(contest.status.enumValues),
            }),
        )
        .mutation(async ({ input }) => {
            const [row] = await db
                .update(contest)
                .set({ status: input.status })
                .where(eq(contest.id, input.contestId))
                .returning();
            return row ?? null;
        }),

    delete: teacherProcedure
        .input(z.object({ contestId: z.number().int() }))
        .mutation(async ({ input }) => {
            await db.delete(contest).where(eq(contest.id, input.contestId));
        }),

    addProblem: teacherProcedure
        .input(
            z.object({
                contestId: z.number().int(),
                apiProblemId: z.number().int(),
                label: z.string(),
                maxPoints: z.number().int().min(0),
                displayOrder: z.number().int().min(0),
            }),
        )
        .mutation(async ({ input }) => {
            const [row] = await db
                .insert(contestProblem)
                .values(input)
                .returning();
            return row!;
        }),

    removeProblem: teacherProcedure
        .input(z.object({ contestProblemId: z.number().int() }))
        .mutation(async ({ input }) => {
            await db
                .delete(contestProblem)
                .where(eq(contestProblem.id, input.contestProblemId));
        }),

    updateProblem: teacherProcedure
        .input(
            z.object({
                contestProblemId: z.number().int(),
                label: z.string().optional(),
                maxPoints: z.number().int().min(0).optional(),
            }),
        )
        .mutation(async ({ input }) => {
            const { contestProblemId, ...changes } = input;
            if (Object.values(changes).every((v) => v === undefined)) {
                return null;
            }

            const [row] = await db
                .update(contestProblem)
                .set(changes)
                .where(eq(contestProblem.id, contestProblemId))
                .returning();
            return row ?? null;
        }),
};
