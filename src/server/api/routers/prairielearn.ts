import z from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, count, eq, sql } from "drizzle-orm";
import { env } from "~/env";
import { db } from "~/server/db";
import { user } from "~/server/db/schema/auth";
import { member, organization } from "~/server/db/schema/organization";
import {
    prairielearnAssessment,
    prairielearnAttempt,
    prairielearnCourse,
    prairielearnUser,
} from "~/server/db/schema/prairielearn";
import {
    courseInstanceName,
    getCourseInstance,
    PrairieLearnError,
} from "~/server/prairielearn/api";
import { connectionOf, sealToken } from "~/server/prairielearn/connection";
import {
    isConnected,
    memberCourse,
    schoolCourse,
    type SchoolCourse,
} from "~/server/prairielearn/leaderboard";
import { normalizeServerUrl } from "~/server/prairielearn/server-url";
import { syncSchoolOnce } from "~/server/prairielearn/sync";
import { requireSchool } from "~/server/organizations";
import {
    createTRPCRouter,
    siteAdminProcedure,
    teacherProcedure,
} from "../trpc";

/** Runs a PrairieLearn request, turning its failures into tRPC errors. */
async function fromPrairieLearn<T>(request: () => Promise<T>): Promise<T> {
    try {
        return await request();
    } catch (error) {
        if (error instanceof PrairieLearnError) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: error.message,
            });
        }
        throw error;
    }
}

/**
 * What browsers may see of a school's settings: never the token, only
 * whether there is one.
 */
async function courseStatus(course: SchoolCourse | null) {
    if (!course) return null;
    const [connectedBy] = course.connectedBy
        ? await db
              .select({ name: user.name })
              .from(user)
              .where(eq(user.id, course.connectedBy))
        : [];
    return {
        connected: isConnected(course),
        serverUrl: course.serverUrl,
        courseInstanceId: course.courseInstanceId,
        name: course.name,
        connectedByName: connectedBy?.name ?? null,
        connectedAt: course.connectedAt,
        syncedAt: course.syncedAt,
        syncError: course.syncError,
    };
}

/**
 * The teacher's school's settings, or NOT_FOUND if a site admin hasn't
 * turned the feature on for it (or the teacher is no longer a current
 * member).
 */
async function requireEnabled(userId: string, organizationId: string) {
    const course = await memberCourse(userId, organizationId);
    if (!course) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message:
                "PrairieLearn practice tests aren't turned on for your school.",
        });
    }
    return course;
}

/** Like requireEnabled, but also requires a connected course. */
async function requireConnected(userId: string, organizationId: string) {
    const course = await requireEnabled(userId, organizationId);
    if (!isConnected(course)) {
        throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Connect your school's PrairieLearn course first.",
        });
    }
    return course;
}

/** Forgets everything copied from a school's course, links included. */
async function forgetResults(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    organizationId: string,
) {
    // Attempts cascade from both.
    await tx
        .delete(prairielearnAssessment)
        .where(eq(prairielearnAssessment.organizationId, organizationId));
    await tx
        .delete(prairielearnUser)
        .where(eq(prairielearnUser.organizationId, organizationId));
}

const allowHttp = () => env.NODE_ENV === "development";

export const prairielearnRouter = createTRPCRouter({
    // ── Teachers of a school with the feature on ────────────────────────

    /**
     * The school's PrairieLearn connection and how its last copy went, or
     * null if the feature isn't on for the school.
     */
    getStatus: teacherProcedure.query(async ({ ctx }) =>
        courseStatus(await memberCourse(ctx.user.id, ctx.organizationId)),
    ),

    /**
     * Connects the school to a course instance with the teacher's
     * PrairieLearn token, after checking the token can see it, then copies
     * its results. The token may be left out to keep the saved one (same
     * server only). Switching to another course instance or server forgets
     * the old one's results and links.
     */
    connect: teacherProcedure
        .input(
            z.object({
                serverUrl: z.string().trim().min(1).max(200),
                courseInstanceId: z
                    .string()
                    .trim()
                    .regex(/^\d+$/, "Course instance IDs are numbers."),
                token: z.string().trim().max(200).optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const course = await requireEnabled(
                ctx.user.id,
                ctx.organizationId,
            );
            const serverUrl = normalizeServerUrl(input.serverUrl, {
                allowHttp: allowHttp(),
            });
            if (!serverUrl) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        "Enter your PrairieLearn address, like https://us.prairielearn.com",
                });
            }
            const sameServer = serverUrl === course.serverUrl;
            let token = input.token ?? "";
            if (!token && sameServer) {
                token =
                    (await fromPrairieLearn(async () => connectionOf(course)))
                        ?.token ?? "";
            }
            if (!token) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Enter your PrairieLearn access token.",
                });
            }

            const instance = await fromPrairieLearn(() =>
                getCourseInstance({
                    serverUrl,
                    token,
                    courseInstanceId: input.courseInstanceId,
                }),
            );

            const changed =
                !sameServer ||
                course.courseInstanceId !== input.courseInstanceId;
            await db.transaction(async (tx) => {
                if (changed) await forgetResults(tx, ctx.organizationId);
                await tx
                    .update(prairielearnCourse)
                    .set({
                        serverUrl,
                        courseInstanceId: input.courseInstanceId,
                        encryptedToken: sealToken(token),
                        name: courseInstanceName(instance),
                        connectedBy: ctx.user.id,
                        connectedAt: new Date(),
                        syncError: null,
                        ...(changed && { syncedAt: null }),
                    })
                    .where(
                        eq(
                            prairielearnCourse.organizationId,
                            ctx.organizationId,
                        ),
                    );
            });

            // Connected even if this first copy fails; the course records
            // the error, and the next page view retries.
            await syncSchoolOnce(ctx.organizationId).catch(() => undefined);
            return courseStatus(await schoolCourse(ctx.organizationId));
        }),

    /**
     * Disconnects the school's course: deletes the saved token and forgets
     * the copied results and links. The feature stays on.
     */
    disconnect: teacherProcedure.mutation(async ({ ctx }) => {
        await requireEnabled(ctx.user.id, ctx.organizationId);
        await db.transaction(async (tx) => {
            await forgetResults(tx, ctx.organizationId);
            await tx
                .update(prairielearnCourse)
                .set({
                    serverUrl: null,
                    courseInstanceId: null,
                    encryptedToken: null,
                    name: null,
                    connectedBy: null,
                    connectedAt: null,
                    syncedAt: null,
                    syncError: null,
                })
                .where(
                    eq(prairielearnCourse.organizationId, ctx.organizationId),
                );
        });
    }),

    /** Copies the latest results from PrairieLearn now. */
    sync: teacherProcedure.mutation(async ({ ctx }) => {
        await requireConnected(ctx.user.id, ctx.organizationId);
        await fromPrairieLearn(() => syncSchoolOnce(ctx.organizationId));
    }),

    /**
     * Everyone who has taken a practice test, with the site account they're
     * linked to: unlinked first, then by name.
     */
    listUsers: teacherProcedure.query(async ({ ctx }) => {
        await requireConnected(ctx.user.id, ctx.organizationId);
        return db
            .select({
                prairielearnUserId: prairielearnUser.prairielearnUserId,
                uid: prairielearnUser.uid,
                name: prairielearnUser.name,
                userId: prairielearnUser.userId,
                linkedByTeacher: prairielearnUser.linkedByTeacher,
                linkedName: user.name,
                attempts: count(prairielearnAttempt.assessmentInstanceId),
            })
            .from(prairielearnUser)
            .leftJoin(user, eq(user.id, prairielearnUser.userId))
            .leftJoin(
                prairielearnAttempt,
                and(
                    eq(
                        prairielearnAttempt.organizationId,
                        prairielearnUser.organizationId,
                    ),
                    eq(
                        prairielearnAttempt.prairielearnUserId,
                        prairielearnUser.prairielearnUserId,
                    ),
                ),
            )
            .where(eq(prairielearnUser.organizationId, ctx.organizationId))
            .groupBy(
                prairielearnUser.organizationId,
                prairielearnUser.prairielearnUserId,
                user.name,
            )
            .orderBy(
                sql`${prairielearnUser.userId} IS NOT NULL`,
                asc(prairielearnUser.name),
            );
    }),

    /**
     * Links a PrairieLearn user to a member of the school (or unlinks them,
     * with null). Their results then count for that member. Several
     * PrairieLearn users may be linked to one member.
     */
    setLink: teacherProcedure
        .input(
            z.object({
                prairielearnUserId: z.string(),
                userId: z.string().nullable(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            await requireConnected(ctx.user.id, ctx.organizationId);
            if (input.userId !== null) {
                const [inSchool] = await db
                    .select({ id: member.id })
                    .from(member)
                    .where(
                        and(
                            eq(member.organizationId, ctx.organizationId),
                            eq(member.userId, input.userId),
                        ),
                    );
                if (!inSchool) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "That person isn't in your school.",
                    });
                }
            }
            const updated = await db
                .update(prairielearnUser)
                .set({ userId: input.userId, linkedByTeacher: true })
                .where(
                    and(
                        eq(prairielearnUser.organizationId, ctx.organizationId),
                        eq(
                            prairielearnUser.prairielearnUserId,
                            input.prairielearnUserId,
                        ),
                    ),
                )
                .returning({ id: prairielearnUser.prairielearnUserId });
            if (updated.length === 0) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "No such PrairieLearn user.",
                });
            }
        }),

    // ── Site admins ─────────────────────────────────────────────────────

    /**
     * Whether a school has the feature (null if not), and its connection.
     */
    getAccess: siteAdminProcedure
        .input(z.object({ organizationId: z.string() }))
        .query(async ({ input }) =>
            courseStatus(await schoolCourse(input.organizationId)),
        ),

    /**
     * Turns the practice-test leaderboard on for a school, so its teachers
     * can connect a course, or off, which deletes the connection (and saved
     * token) and everything copied.
     */
    setEnabled: siteAdminProcedure
        .input(z.object({ organizationId: z.string(), enabled: z.boolean() }))
        .mutation(async ({ input: { organizationId, enabled } }) => {
            const [school] = await db
                .select({ id: organization.id })
                .from(organization)
                .where(eq(organization.id, organizationId));
            requireSchool(school);
            if (enabled) {
                await db
                    .insert(prairielearnCourse)
                    .values({ organizationId })
                    .onConflictDoNothing();
            } else {
                await db
                    .delete(prairielearnCourse)
                    .where(
                        eq(prairielearnCourse.organizationId, organizationId),
                    );
            }
        }),
});
