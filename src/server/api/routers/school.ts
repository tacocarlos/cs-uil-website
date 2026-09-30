import { randomUUID } from "node:crypto";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, count, eq, ilike, ne, sql } from "drizzle-orm";
import { auth } from "auth";
import {
    createTRPCRouter,
    protectedProcedure,
    siteAdminProcedure,
    teacherProcedure,
} from "../trpc";
import { db } from "~/server/db";
import { user } from "~/server/db/schema/auth";
import { member, organization } from "~/server/db/schema/organization";
import { generateJoinCode, normalizeJoinCode } from "~/lib/join-codes";
import { CONFERENCES, MAX_DISTRICT, REGIONS } from "~/lib/schools";

/** UIL classification; null clears a value. */
const classificationInput = z.object({
    conference: z.enum(CONFERENCES).nullable(),
    region: z.number().int().min(1).max(REGIONS.length).nullable(),
    district: z.number().int().min(1).max(MAX_DISTRICT).nullable(),
});

const SCHOOLS_PER_PAGE = 25;

const schoolColumns = {
    id: organization.id,
    name: organization.name,
    conference: organization.conference,
    region: organization.region,
    district: organization.district,
};

async function setClassification(
    organizationId: string,
    classification: z.infer<typeof classificationInput>,
) {
    const [school] = await db
        .update(organization)
        .set(classification)
        .where(eq(organization.id, organizationId))
        .returning(schoolColumns);
    if (!school) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No such school" });
    }
    return school;
}

/** "Groveton High School" → "groveton-high-school-3f9a2c". */
function schoolSlug(name: string) {
    const base = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50);
    // Suffix so schools with the same name (there are several "Central
    // High School"s) get distinct slugs.
    return `${base || "school"}-${randomUUID().slice(0, 6)}`;
}

/** Case-insensitive "name contains", with LIKE wildcards matched literally. */
function nameContains(query: string) {
    return ilike(organization.name, `%${query.replace(/[\\%_]/g, "\\$&")}%`);
}

// Teachers manage their active school; site admins manage every school;
// anyone signed in can join a school with its code.
export const schoolRouter = createTRPCRouter({
    /**
     * Other schools by name, e.g. to invite to a contest. Returns only
     * public details (no join codes).
     */
    lookup: teacherProcedure
        .input(z.object({ query: z.string().trim().min(1).max(100) }))
        .query(({ ctx, input }) =>
            db
                .select(schoolColumns)
                .from(organization)
                .where(
                    and(
                        nameContains(input.query),
                        ne(organization.id, ctx.organizationId),
                    ),
                )
                .orderBy(asc(organization.name))
                .limit(10),
        ),

    getMine: teacherProcedure.query(async ({ ctx }) => {
        const [school] = await db
            .select({ ...schoolColumns, joinCode: organization.joinCode })
            .from(organization)
            .where(eq(organization.id, ctx.organizationId))
            .limit(1);
        return school ?? null;
    }),

    setMyClassification: teacherProcedure
        .input(classificationInput)
        .mutation(({ ctx, input }) =>
            setClassification(ctx.organizationId, input),
        ),

    /** Replaces the school's join code; the old one stops working. */
    regenerateJoinCode: teacherProcedure.mutation(async ({ ctx }) => {
        const [school] = await db
            .update(organization)
            .set({ joinCode: generateJoinCode() })
            .where(eq(organization.id, ctx.organizationId))
            .returning({ joinCode: organization.joinCode });
        return school?.joinCode ?? null;
    }),

    /**
     * Everyone in the teacher's school: teachers, then current students,
     * then former students, each by name.
     */
    listMembers: teacherProcedure.query(({ ctx }) =>
        db
            .select({
                userId: member.userId,
                role: member.role,
                joinedAt: member.createdAt,
                formerAt: member.formerAt,
                name: user.name,
                email: user.email,
            })
            .from(member)
            .innerJoin(user, eq(member.userId, user.id))
            .where(eq(member.organizationId, ctx.organizationId))
            .orderBy(
                sql`CASE WHEN ${member.role} = 'owner' THEN 0 WHEN ${member.role} = 'admin' THEN 1 WHEN ${member.formerAt} IS NULL THEN 2 ELSE 3 END`,
                asc(user.name),
            ),
    ),

    /**
     * Marks a student as a former student (graduated or left), or back as
     * current. Former students keep their history but are left out of
     * leaderboards and student pickers.
     */
    setFormer: teacherProcedure
        .input(z.object({ userId: z.string(), former: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const updated = await db
                .update(member)
                .set({ formerAt: input.former ? new Date() : null })
                .where(
                    and(
                        eq(member.organizationId, ctx.organizationId),
                        eq(member.userId, input.userId),
                        eq(member.role, "member"),
                    ),
                )
                .returning({ id: member.id });
            if (updated.length === 0) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Only students in your school can be changed.",
                });
            }
        }),

    /**
     * Removes a student from the teacher's school (e.g. someone who joined
     * with a leaked code). Teachers are managed by site admins.
     */
    removeMember: teacherProcedure
        .input(z.object({ userId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const removed = await db
                .delete(member)
                .where(
                    and(
                        eq(member.organizationId, ctx.organizationId),
                        eq(member.userId, input.userId),
                        eq(member.role, "member"),
                    ),
                )
                .returning({ id: member.id });
            if (removed.length === 0) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Only students in your school can be removed.",
                });
            }
        }),

    /** Joins the school with this code and makes it the active school. */
    join: protectedProcedure
        .input(z.object({ code: z.string().max(20) }))
        .mutation(async ({ ctx, input }) => {
            const code = normalizeJoinCode(input.code);
            const [school] = code
                ? await db
                      .select({ id: organization.id, name: organization.name })
                      .from(organization)
                      .where(eq(organization.joinCode, code))
                      .limit(1)
                : [];
            if (!school) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message:
                        "That join code doesn't match any school. Check it with your teacher.",
                });
            }

            const inserted = await db
                .insert(member)
                .values({
                    id: randomUUID(),
                    organizationId: school.id,
                    userId: ctx.user.id,
                    role: "member",
                    createdAt: new Date(),
                })
                .onConflictDoNothing()
                .returning({ id: member.id });

            await auth.api.setActiveOrganization({
                headers: ctx.headers,
                body: { organizationId: school.id },
            });
            return { name: school.name, alreadyMember: inserted.length === 0 };
        }),

    /** Schools whose name contains `query`, a page at a time, by name. */
    search: siteAdminProcedure
        .input(
            z.object({
                query: z.string().trim().max(100).default(""),
                page: z.number().int().min(0).default(0),
            }),
        )
        .query(async ({ input: { query, page } }) => {
            const matches = query ? nameContains(query) : undefined;
            const [schools, [total]] = await Promise.all([
                db
                    .select(schoolColumns)
                    .from(organization)
                    .where(matches)
                    .orderBy(asc(organization.name), asc(organization.id))
                    .limit(SCHOOLS_PER_PAGE)
                    .offset(page * SCHOOLS_PER_PAGE),
                db.select({ n: count() }).from(organization).where(matches),
            ]);
            return {
                schools,
                total: total?.n ?? 0,
                pageSize: SCHOOLS_PER_PAGE,
            };
        }),

    setClassification: siteAdminProcedure
        .input(classificationInput.extend({ organizationId: z.string() }))
        .mutation(({ input: { organizationId, ...classification } }) =>
            setClassification(organizationId, classification),
        ),

    /** Creates a school (with a join code). The admin doesn't join it. */
    create: siteAdminProcedure
        .input(
            classificationInput.extend({
                name: z.string().trim().min(2).max(100),
            }),
        )
        .mutation(async ({ input: { name, ...classification } }) => {
            const [school] = await db
                .insert(organization)
                .values({
                    id: randomUUID(),
                    name,
                    slug: schoolSlug(name),
                    joinCode: generateJoinCode(),
                    createdAt: new Date(),
                    ...classification,
                })
                .returning(schoolColumns);
            return school!;
        }),

    /**
     * Makes an existing user (who has signed in at least once) a teacher
     * (admin) of a school. Owners stay owners.
     */
    addTeacher: siteAdminProcedure
        .input(
            z.object({
                organizationId: z.string(),
                email: z.string().trim().email(),
            }),
        )
        .mutation(async ({ input }) => {
            const [[school], [teacher]] = await Promise.all([
                db
                    .select({ id: organization.id, name: organization.name })
                    .from(organization)
                    .where(eq(organization.id, input.organizationId))
                    .limit(1),
                db
                    .select({ id: user.id, name: user.name })
                    .from(user)
                    .where(
                        eq(
                            sql`lower(${user.email})`,
                            input.email.toLowerCase(),
                        ),
                    )
                    .limit(1),
            ]);
            if (!school) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "No such school",
                });
            }
            if (!teacher) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: `No account uses ${input.email}. Ask them to sign in once, then try again.`,
                });
            }

            await db
                .insert(member)
                .values({
                    id: randomUUID(),
                    organizationId: school.id,
                    userId: teacher.id,
                    role: "admin",
                    createdAt: new Date(),
                })
                .onConflictDoUpdate({
                    target: [member.organizationId, member.userId],
                    set: { role: "admin" },
                    setWhere: ne(member.role, "owner"),
                });
            return { teacher: teacher.name, school: school.name };
        }),
});
