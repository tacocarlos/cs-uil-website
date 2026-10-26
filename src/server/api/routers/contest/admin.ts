import z from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, notInArray } from "drizzle-orm";
import { contestManagerProcedure, teacherProcedure } from "../../trpc";
import { db } from "~/server/db";
import {
    CONTEST_VISIBILITIES,
    contest,
    contestInvite,
    contestProblem,
} from "~/server/db/schema/contest";
import { organization } from "~/server/db/schema/organization";
import { requireManagedContest, type ContestManager } from "~/server/contests";

const scoringMode = z.enum(contest.scoringMode.enumValues);
const visibility = z.enum(CONTEST_VISIBILITIES);
/** Schools invited to an invite-only contest (replaces the previous list). */
const invitedSchoolIds = z.array(z.string()).max(500);

/**
 * The host school a contest should have, given who is asking. Global
 * ("open") contests have none and are site-admin only. Teachers always
 * host at their active school; site admins may pick any school
 * (`requestedHost`), defaulting to the contest's current host.
 */
async function resolveHost(
    manager: ContestManager,
    newVisibility: (typeof CONTEST_VISIBILITIES)[number],
    requestedHost: string | undefined,
    currentHost: string | null,
): Promise<string | null> {
    if (newVisibility === "open") {
        if (!manager.siteAdmin) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Only site admins can create global contests.",
            });
        }
        return null;
    }

    if (!manager.siteAdmin) {
        if (
            requestedHost !== undefined &&
            requestedHost !== manager.organizationId
        ) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Teachers can only host contests at their school.",
            });
        }
        return currentHost ?? manager.organizationId;
    }

    const host = requestedHost ?? currentHost ?? manager.organizationId;
    if (!host) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Choose a host school, or make it a global contest.",
        });
    }
    const [school] = await db
        .select({ id: organization.id })
        .from(organization)
        .where(eq(organization.id, host))
        .limit(1);
    if (!school) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No such school" });
    }
    return host;
}

/**
 * Sets a contest's invited schools (never the host). Schools that stay
 * invited keep their decline status; new ones start undeclined.
 */
async function setInvites(
    contestId: number,
    hostId: string | null,
    schoolIds: string[],
) {
    const guests = [...new Set(schoolIds)].filter((id) => id !== hostId);
    await db.transaction(async (tx) => {
        await tx
            .delete(contestInvite)
            .where(
                and(
                    eq(contestInvite.contestId, contestId),
                    guests.length > 0
                        ? notInArray(contestInvite.organizationId, guests)
                        : undefined,
                ),
            );
        if (guests.length > 0) {
            await tx
                .insert(contestInvite)
                .values(
                    guests.map((organizationId) => ({
                        contestId,
                        organizationId,
                    })),
                )
                .onConflictDoNothing();
        }
    });
}

/** The contest a contest problem belongs to, if the manager manages it. */
async function requireManagedProblem(
    contestProblemId: number,
    manager: ContestManager,
) {
    const [row] = await db
        .select({ contestId: contestProblem.contestId })
        .from(contestProblem)
        .where(eq(contestProblem.id, contestProblemId))
        .limit(1);
    if (!row) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "No such contest problem",
        });
    }
    await requireManagedContest(row.contestId, manager);
}

/**
 * Creating, editing, and deleting contests and their problem lists. Teachers
 * manage their school's contests (and may invite other schools); site
 * admins manage every contest and alone create global ones.
 */
export const contestAdmin = {
    create: contestManagerProcedure
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
                /** Site admins only: the host school (any school). */
                organizationId: z.string().optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { invitedSchoolIds, organizationId, ...fields } = input;
            const host = await resolveHost(
                ctx.manager,
                input.visibility,
                organizationId,
                null,
            );
            const [row] = await db
                .insert(contest)
                .values({
                    ...fields,
                    startsAt: new Date(input.startsAt),
                    endsAt: new Date(input.endsAt),
                    createdBy: ctx.user.id,
                    organizationId: host,
                })
                .returning();
            if (input.visibility === "invite") {
                await setInvites(row!.id, host, invitedSchoolIds);
            }
            return row!;
        }),

    update: contestManagerProcedure
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
                /** Site admins only: move the contest to another host. */
                organizationId: z.string().optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const {
                contestId,
                startsAt,
                endsAt,
                invitedSchoolIds,
                organizationId,
                ...rest
            } = input;
            const existing = await requireManagedContest(
                contestId,
                ctx.manager,
            );

            const newVisibility = input.visibility ?? existing.visibility;
            const host = await resolveHost(
                ctx.manager,
                newVisibility,
                organizationId,
                existing.organizationId,
            );
            // Only invite-only contests have invited schools.
            if (newVisibility !== "invite") {
                await setInvites(contestId, host, []);
            } else if (invitedSchoolIds) {
                await setInvites(contestId, host, invitedSchoolIds);
            }

            // Drizzle skips undefined values in `.set()`, so omitted fields
            // are left unchanged.
            const [row] = await db
                .update(contest)
                .set({
                    ...rest,
                    organizationId: host,
                    startsAt: startsAt ? new Date(startsAt) : undefined,
                    endsAt: endsAt ? new Date(endsAt) : undefined,
                })
                .where(eq(contest.id, contestId))
                .returning();
            return row ?? null;
        }),

    setStatus: contestManagerProcedure
        .input(
            z.object({
                contestId: z.number().int(),
                status: z.enum(contest.status.enumValues),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const existing = await requireManagedContest(
                input.contestId,
                ctx.manager,
            );
            // Starting or ending by hand moves the schedule to now, so the
            // times shown stay true.
            const now = new Date();
            const [row] = await db
                .update(contest)
                .set({
                    status: input.status,
                    startsAt:
                        input.status === "active" && existing.startsAt > now
                            ? now
                            : undefined,
                    endsAt:
                        input.status === "ended" && existing.endsAt > now
                            ? now
                            : undefined,
                })
                .where(eq(contest.id, input.contestId))
                .returning();
            return row ?? null;
        }),

    /** Deletes a contest with its problems, enrollments, and results. */
    delete: contestManagerProcedure
        .input(z.object({ contestId: z.number().int() }))
        .mutation(async ({ ctx, input }) => {
            await requireManagedContest(input.contestId, ctx.manager);
            await db.delete(contest).where(eq(contest.id, input.contestId));
        }),

    addProblem: contestManagerProcedure
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
            await requireManagedContest(input.contestId, ctx.manager);
            const [row] = await db
                .insert(contestProblem)
                .values(input)
                .returning();
            return row!;
        }),

    removeProblem: contestManagerProcedure
        .input(z.object({ contestProblemId: z.number().int() }))
        .mutation(async ({ ctx, input }) => {
            await requireManagedProblem(input.contestProblemId, ctx.manager);
            await db
                .delete(contestProblem)
                .where(eq(contestProblem.id, input.contestProblemId));
        }),

    /**
     * An invited school's teachers decline (or accept again) another
     * school's invitation. Declining hides the contest from the school's
     * students; those already enrolled keep their results.
     */
    respondToInvitation: teacherProcedure
        .input(z.object({ contestId: z.number().int(), decline: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const updated = await db
                .update(contestInvite)
                .set({ declinedAt: input.decline ? new Date() : null })
                .where(
                    and(
                        eq(contestInvite.contestId, input.contestId),
                        eq(contestInvite.organizationId, ctx.organizationId),
                    ),
                )
                .returning({ contestId: contestInvite.contestId });
            if (updated.length === 0) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Your school isn't invited to that contest.",
                });
            }
        }),

    updateProblem: contestManagerProcedure
        .input(
            z.object({
                contestProblemId: z.number().int(),
                label: z.string().optional(),
                maxPoints: z.number().int().min(0).optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { contestProblemId, ...changes } = input;
            await requireManagedProblem(contestProblemId, ctx.manager);
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
