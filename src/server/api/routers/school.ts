import z from "zod";
import { TRPCError } from "@trpc/server";
import { asc, count, eq, ilike } from "drizzle-orm";
import {
    createTRPCRouter,
    siteAdminProcedure,
    teacherProcedure,
} from "../trpc";
import { db } from "~/server/db";
import { organization } from "~/server/db/schema/organization";
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

// Teachers manage their active school; site admins manage every school.
export const schoolRouter = createTRPCRouter({
    getMine: teacherProcedure.query(async ({ ctx }) => {
        const [school] = await db
            .select(schoolColumns)
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

    /** Schools whose name contains `query`, a page at a time, by name. */
    search: siteAdminProcedure
        .input(
            z.object({
                query: z.string().trim().max(100).default(""),
                page: z.number().int().min(0).default(0),
            }),
        )
        .query(async ({ input: { query, page } }) => {
            // Escape LIKE wildcards so "%" and "_" match literally.
            const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
            const matches = query
                ? ilike(organization.name, pattern)
                : undefined;
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
});
