import z from "zod";
import { TRPCError } from "@trpc/server";
import { APIError } from "better-auth/api";
import {
    and,
    asc,
    count,
    desc,
    eq,
    exists,
    ilike,
    inArray,
    not,
    or,
    type SQL,
} from "drizzle-orm";
import { auth } from "auth";
import { MAX_BAN_SECONDS } from "~/lib/auth/bans";
import { TEACHER_ROLES } from "~/lib/auth/organizations";
import { createTRPCRouter, siteAdminProcedure } from "../trpc";
import { db } from "~/server/db";
import { user } from "~/server/db/schema/auth";
import { member, organization } from "~/server/db/schema/organization";

const USERS_PER_PAGE = 25;

/**
 * Who to list. Teacher and student are school roles (in the chosen school,
 * or any school); "none" is users in no school.
 */
export const USER_FILTER_ROLES = [
    "site-admin",
    "teacher",
    "student",
    "none",
] as const;

/** `text` contains `query`, case-insensitively and literally. */
function contains(column: typeof user.name | typeof user.email, query: string) {
    return ilike(column, `%${query.replace(/[\\%_]/g, "\\$&")}%`);
}

/** The user has a membership matching `where`. */
function hasMembership(where?: SQL) {
    return exists(
        db
            .select({ one: member.id })
            .from(member)
            .where(and(eq(member.userId, user.id), where)),
    );
}

/** Runs a better-auth call, reporting its refusals as tRPC errors. */
async function authCall<T>(call: () => Promise<T>): Promise<T> {
    try {
        return await call();
    } catch (err) {
        if (err instanceof APIError) {
            throw new TRPCError({
                code: err.statusCode === 403 ? "FORBIDDEN" : "BAD_REQUEST",
                message: err.body?.message ?? err.message,
            });
        }
        throw err;
    }
}

// Site-wide user management. Banning goes through better-auth's admin
// plugin (as the signed-in admin, so it checks their permissions) so that
// it also ends the user's sessions.
export const adminRouter = createTRPCRouter({
    /**
     * Users matching a name or email search, role, and school, a page at a
     * time, newest first, with their schools.
     */
    listUsers: siteAdminProcedure
        .input(
            z.object({
                query: z.string().trim().max(100).default(""),
                role: z.enum(USER_FILTER_ROLES).nullable().default(null),
                organizationId: z.string().nullable().default(null),
                page: z.number().int().min(0).default(0),
            }),
        )
        .query(async ({ input: { query, role, organizationId, page } }) => {
            const inSchool = organizationId
                ? eq(member.organizationId, organizationId)
                : undefined;
            const roleFilter = {
                "site-admin": eq(user.role, "site-admin"),
                teacher: hasMembership(
                    and(inSchool, inArray(member.role, TEACHER_ROLES)),
                ),
                student: hasMembership(
                    and(inSchool, eq(member.role, "member")),
                ),
                none: not(hasMembership()),
            };
            const where = and(
                query
                    ? or(
                          contains(user.name, query),
                          contains(user.email, query),
                      )
                    : undefined,
                role ? roleFilter[role] : undefined,
                organizationId ? hasMembership(inSchool) : undefined,
            );

            const [users, [total]] = await Promise.all([
                db
                    .select({
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        image: user.image,
                        role: user.role,
                        createdAt: user.createdAt,
                        banned: user.banned,
                        banReason: user.banReason,
                        banExpires: user.banExpires,
                    })
                    .from(user)
                    .where(where)
                    .orderBy(desc(user.createdAt), asc(user.id))
                    .limit(USERS_PER_PAGE)
                    .offset(page * USERS_PER_PAGE),
                db.select({ n: count() }).from(user).where(where),
            ]);

            const schools = users.length
                ? await db
                      .select({
                          userId: member.userId,
                          id: organization.id,
                          name: organization.name,
                          role: member.role,
                          formerAt: member.formerAt,
                      })
                      .from(member)
                      .innerJoin(
                          organization,
                          eq(organization.id, member.organizationId),
                      )
                      .where(
                          inArray(
                              member.userId,
                              users.map((u) => u.id),
                          ),
                      )
                      .orderBy(asc(organization.name))
                : [];

            return {
                users: users.map((u) => ({
                    ...u,
                    schools: schools.filter((s) => s.userId === u.id),
                })),
                total: total?.n ?? 0,
                pageSize: USERS_PER_PAGE,
            };
        }),

    /**
     * Suspends a user and signs them out everywhere. With no
     * `expiresInSeconds` the ban lasts until lifted.
     */
    banUser: siteAdminProcedure
        .input(
            z.object({
                userId: z.string(),
                reason: z.string().trim().min(1).max(500).optional(),
                expiresInSeconds: z
                    .number()
                    .int()
                    .min(60)
                    .max(MAX_BAN_SECONDS)
                    .nullable(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { user: banned } = await authCall(() =>
                auth.api.banUser({
                    headers: ctx.headers,
                    body: {
                        userId: input.userId,
                        banReason: input.reason,
                        banExpiresIn: input.expiresInSeconds ?? undefined,
                    },
                }),
            );
            return { name: banned.name };
        }),

    /** Lifts a user's ban. */
    unbanUser: siteAdminProcedure
        .input(z.object({ userId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { user: unbanned } = await authCall(() =>
                auth.api.unbanUser({
                    headers: ctx.headers,
                    body: { userId: input.userId },
                }),
            );
            return { name: unbanned.name };
        }),
});
