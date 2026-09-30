import z from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { teacherProcedure } from "../../trpc";
import { db } from "~/server/db";
import {
    CONTEST_VISIBILITIES,
    contest,
    contestInvite,
    contestProblem,
} from "~/server/db/schema/contest";
import { requireHostedContest } from "~/server/contests";

const scoringMode = z.enum(contest.scoringMode.enumValues);
const visibility = z.enum(CONTEST_VISIBILITIES);
/** Schools invited to an invite-only contest (replaces the previous list). */
const invitedSchoolIds = z.array(z.string()).max(500);

/** Contests hosted by a school, for limiting changes to them. */
function hostedBy(organizationId: string) {
    return db
        .select({ id: contest.id })
        .from(contest)
        .where(eq(contest.organizationId, organizationId));
}

/** Replaces a contest's invited schools (never including the host). */
async function setInvites(
    contestId: number,
    hostId: string,
    schoolIds: string[],
) {
    const guests = [...new Set(schoolIds)].filter((id) => id !== hostId);
    await db.transaction(async (tx) => {
        await tx
            .delete(contestInvite)
            .where(eq(contestInvite.contestId, contestId));
        if (guests.length > 0) {
            await tx.insert(contestInvite).values(
                guests.map((organizationId) => ({
                    contestId,
                    organizationId,
                })),
            );
        }
    });
}

/**
 * Creating and editing contests and their problem lists (teacher tools).
 * Teachers only manage contests hosted by their active school.
 */
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
                visibility: visibility.default("school"),
                invitedSchoolIds: invitedSchoolIds.default([]),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { invitedSchoolIds, ...fields } = input;
            const [row] = await db
                .insert(contest)
                .values({
                    ...fields,
                    startsAt: new Date(input.startsAt),
                    endsAt: new Date(input.endsAt),
                    createdBy: ctx.user.id,
                    organizationId: ctx.organizationId,
                })
                .returning();
            await setInvites(row!.id, ctx.organizationId, invitedSchoolIds);
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
                visibility: visibility.optional(),
                invitedSchoolIds: invitedSchoolIds.optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { contestId, startsAt, endsAt, invitedSchoolIds, ...rest } =
                input;
            await requireHostedContest(contestId, ctx.organizationId);
            if (invitedSchoolIds) {
                await setInvites(
                    contestId,
                    ctx.organizationId,
                    invitedSchoolIds,
                );
            }

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
        .mutation(async ({ ctx, input }) => {
            const [row] = await db
                .update(contest)
                .set({ status: input.status })
                .where(
                    and(
                        eq(contest.id, input.contestId),
                        eq(contest.organizationId, ctx.organizationId),
                    ),
                )
                .returning();
            return row ?? null;
        }),

    delete: teacherProcedure
        .input(z.object({ contestId: z.number().int() }))
        .mutation(async ({ ctx, input }) => {
            await db
                .delete(contest)
                .where(
                    and(
                        eq(contest.id, input.contestId),
                        eq(contest.organizationId, ctx.organizationId),
                    ),
                );
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
        .mutation(async ({ ctx, input }) => {
            await requireHostedContest(input.contestId, ctx.organizationId);
            const [row] = await db
                .insert(contestProblem)
                .values(input)
                .returning();
            return row!;
        }),

    removeProblem: teacherProcedure
        .input(z.object({ contestProblemId: z.number().int() }))
        .mutation(async ({ ctx, input }) => {
            await db
                .delete(contestProblem)
                .where(
                    and(
                        eq(contestProblem.id, input.contestProblemId),
                        inArray(
                            contestProblem.contestId,
                            hostedBy(ctx.organizationId),
                        ),
                    ),
                );
        }),

    updateProblem: teacherProcedure
        .input(
            z.object({
                contestProblemId: z.number().int(),
                label: z.string().optional(),
                maxPoints: z.number().int().min(0).optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { contestProblemId, ...changes } = input;
            if (Object.values(changes).every((v) => v === undefined)) {
                return null;
            }

            const [row] = await db
                .update(contestProblem)
                .set(changes)
                .where(
                    and(
                        eq(contestProblem.id, contestProblemId),
                        inArray(
                            contestProblem.contestId,
                            hostedBy(ctx.organizationId),
                        ),
                    ),
                )
                .returning();
            if (!row) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "No such contest problem at your school",
                });
            }
            return row;
        }),
};
