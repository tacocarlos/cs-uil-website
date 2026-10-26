import z from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import {
    createTRPCRouter,
    protectedProcedure,
    siteAdminProcedure,
} from "../trpc";
import { db } from "~/server/db";
import { featureRequest } from "~/server/db/schema/feature-request";
import { user } from "~/server/db/schema/auth";

const categoryInput = z.enum(featureRequest.category.enumValues);
const statusInput = z.enum(featureRequest.featureStatus.enumValues);

// Any signed-in user can submit requests and see their own; site admins
// see everyone's and respond. Submitters see the admin's response but
// never which admin wrote it.
export const featureRequestRouter = createTRPCRouter({
    submit: protectedProcedure
        .input(
            z.object({
                category: categoryInput,
                message: z.string().trim().min(1).max(2000),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const [request] = await db
                .insert(featureRequest)
                .values({
                    userId: ctx.user.id,
                    category: input.category,
                    message: input.message,
                })
                .returning();
            return request;
        }),

    /** The signed-in user's requests, newest first. */
    getMine: protectedProcedure.query(async ({ ctx }) => {
        return db
            .select({
                id: featureRequest.id,
                timeSubmitted: featureRequest.timeSubmitted,
                category: featureRequest.category,
                message: featureRequest.message,
                featureStatus: featureRequest.featureStatus,
                adminResponse: featureRequest.adminResponse,
            })
            .from(featureRequest)
            .where(
                and(
                    eq(featureRequest.userId, ctx.user.id),
                    isNull(featureRequest.deletedAt),
                ),
            )
            .orderBy(desc(featureRequest.timeSubmitted));
    }),

    /** Withdraws one of the signed-in user's own requests. */
    delete: protectedProcedure
        .input(z.object({ id: z.number().int() }))
        .mutation(async ({ ctx, input }) => {
            const [deleted] = await db
                .update(featureRequest)
                .set({ deletedAt: new Date() })
                .where(
                    and(
                        eq(featureRequest.id, input.id),
                        eq(featureRequest.userId, ctx.user.id),
                        isNull(featureRequest.deletedAt),
                    ),
                )
                .returning({ id: featureRequest.id });
            if (!deleted) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "No such feature request",
                });
            }
            return deleted;
        }),

    /** Every request with its submitter, optionally filtered, newest first. */
    getAll: siteAdminProcedure
        .input(
            z
                .object({
                    status: statusInput.optional(),
                    category: categoryInput.optional(),
                })
                .default({}),
        )
        .query(async ({ input }) => {
            return db
                .select({
                    id: featureRequest.id,
                    timeSubmitted: featureRequest.timeSubmitted,
                    category: featureRequest.category,
                    message: featureRequest.message,
                    featureStatus: featureRequest.featureStatus,
                    adminResponse: featureRequest.adminResponse,
                    submitter: { id: user.id, name: user.name },
                })
                .from(featureRequest)
                .innerJoin(user, eq(featureRequest.userId, user.id))
                .where(
                    and(
                        isNull(featureRequest.deletedAt),
                        input.status
                            ? eq(featureRequest.featureStatus, input.status)
                            : undefined,
                        input.category
                            ? eq(featureRequest.category, input.category)
                            : undefined,
                    ),
                )
                .orderBy(desc(featureRequest.timeSubmitted));
        }),

    /** Sets a request's status and the note shown to its submitter. */
    respond: siteAdminProcedure
        .input(
            z.object({
                id: z.number().int(),
                featureStatus: statusInput,
                adminResponse: z.string().trim().max(2000).nullable(),
            }),
        )
        .mutation(async ({ input }) => {
            const [updated] = await db
                .update(featureRequest)
                .set({
                    featureStatus: input.featureStatus,
                    adminResponse: input.adminResponse || null,
                })
                .where(
                    and(
                        eq(featureRequest.id, input.id),
                        isNull(featureRequest.deletedAt),
                    ),
                )
                .returning();
            if (!updated) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "No such feature request",
                });
            }
            return updated;
        }),
});
