import z from "zod";
import { TRPCError } from "@trpc/server";
import {
    createTRPCRouter,
    publicProcedure,
    teacherProcedure,
    type createTRPCContext,
} from "../trpc";
import { db } from "~/server/db";
import { writtenTests } from "~/server/db/schema/written";
import { user } from "~/server/db/schema/auth";
import { eq, and, desc, isNotNull, asc } from "drizzle-orm";
import {
    inSchool,
    leaderboardVisibility,
    type LeaderboardScope,
} from "~/server/organizations";
import {
    CONFERENCES,
    MAX_DISTRICT,
    REGIONS,
    type SchoolFilter,
} from "~/lib/schools";

/** School (the viewer's active school) or global (opted-in users). */
const scopeInput = z.enum(["school", "global"]).default("school");

/** Global leaderboards only: limit to schools with this classification. */
const filterInput = z
    .object({
        conference: z.enum(CONFERENCES).optional(),
        region: z.number().int().min(1).max(REGIONS.length).optional(),
        district: z.number().int().min(1).max(MAX_DISTRICT).optional(),
    })
    .default({});

/** Condition selecting the users whose scores a leaderboard may show. */
async function visibleUsers(
    ctx: Awaited<ReturnType<typeof createTRPCContext>>,
    scope: LeaderboardScope,
    filter: SchoolFilter,
) {
    const membership =
        scope === "school" ? await ctx.getActiveMembership() : null;
    return leaderboardVisibility(
        scope,
        membership?.organizationId ?? null,
        filter,
    );
}

export const writtenRouter = createTRPCRouter({
    getLeaderboard: publicProcedure
        .input(
            z.object({
                competition: z
                    .enum([
                        "VCM-1",
                        "VCM-2",
                        "VCM-3",
                        "VCM-4",
                        "invA",
                        "invB",
                        "district",
                        "region",
                        "state",
                    ])
                    .optional(),
                year: z.number().int().optional(),
                scope: scopeInput,
                filter: filterInput,
            }),
        )
        .query(async ({ ctx, input }) => {
            const { competition, year, scope, filter } = input;
            // Build where conditions
            const conditions = [await visibleUsers(ctx, scope, filter)];
            if (competition) {
                conditions.push(eq(writtenTests.competition, competition));
            }
            if (year) {
                conditions.push(eq(writtenTests.seasonYear, year));
            }

            // Get written test scores for users who want to show their scores
            const tests = await db
                .select({
                    userId: user.id,
                    userName: user.name,
                    score: writtenTests.score,
                    competition: writtenTests.competition,
                    takenAt: writtenTests.takenAt,
                    accuracy: writtenTests.accuracy,
                })
                .from(writtenTests)
                .innerJoin(user, eq(writtenTests.userId, user.id))
                .where(and(...conditions));

            // Aggregate scores by user
            const scoreMap = new Map<
                string,
                { name: string; totalScore: number }
            >();

            tests.forEach((test) => {
                const current = scoreMap.get(test.userId);
                if (current) {
                    scoreMap.set(test.userId, {
                        name: current.name,
                        totalScore: current.totalScore + test.score,
                    });
                } else {
                    scoreMap.set(test.userId, {
                        name: test.userName,
                        totalScore: test.score,
                    });
                }
            });

            // Convert to array and sort by score descending
            return Array.from(scoreMap.entries())
                .map(([id, data]) => ({
                    id,
                    name: data.name,
                    score: data.totalScore,
                }))
                .sort((a, b) => b.score - a.score);
        }),

    getAvailableCompetitions: publicProcedure
        .input(
            z.object({
                year: z.number().int().optional(),
                scope: scopeInput,
                filter: filterInput,
            }),
        )
        .query(async ({ ctx, input }) => {
            const { year, scope, filter } = input;
            // Get distinct competitions that have at least one score,
            // optionally filtered to a specific season year.
            const conditions = [
                await visibleUsers(ctx, scope, filter),
                isNotNull(writtenTests.competition),
            ];
            if (year !== undefined) {
                conditions.push(eq(writtenTests.seasonYear, year));
            }

            const competitions = await db
                .selectDistinct({ competition: writtenTests.competition })
                .from(writtenTests)
                .innerJoin(user, eq(writtenTests.userId, user.id))
                .where(and(...conditions));

            return competitions
                .map((c) => c.competition)
                .filter((c) => c !== null)
                .sort();
        }),

    getMostRecentCompetition: publicProcedure
        .input(
            z.object({
                year: z.number().int().optional(),
                scope: scopeInput,
                filter: filterInput,
            }),
        )
        .query(async ({ ctx, input }) => {
            const { year, scope, filter } = input;
            // Get the competition with the most recent score,
            // optionally filtered to a specific season year.
            const conditions = [
                await visibleUsers(ctx, scope, filter),
                isNotNull(writtenTests.competition),
            ];
            if (year !== undefined) {
                conditions.push(eq(writtenTests.seasonYear, year));
            }

            const mostRecent = await db
                .select({
                    competition: writtenTests.competition,
                    takenAt: writtenTests.takenAt,
                })
                .from(writtenTests)
                .innerJoin(user, eq(writtenTests.userId, user.id))
                .where(and(...conditions))
                .orderBy(desc(writtenTests.takenAt))
                .limit(1);

            return mostRecent[0]?.competition ?? null;
        }),

    getAvailableYears: publicProcedure
        .input(z.object({ scope: scopeInput, filter: filterInput }))
        .query(async ({ ctx, input }) => {
            // Get all distinct years from written tests
            const years = await db
                .selectDistinct({
                    year: writtenTests.seasonYear,
                })
                .from(writtenTests)
                .innerJoin(user, eq(writtenTests.userId, user.id))
                .where(await visibleUsers(ctx, input.scope, input.filter))
                .orderBy(desc(writtenTests.seasonYear));

            return years
                .map((y) => y.year)
                .filter((y): y is number => y !== null);
        }),

    getMostRecentYear: publicProcedure
        .input(z.object({ scope: scopeInput, filter: filterInput }))
        .query(async ({ ctx, input }) => {
            // Get the most recent year from written tests
            const mostRecent = await db
                .select({
                    year: writtenTests.seasonYear,
                })
                .from(writtenTests)
                .innerJoin(user, eq(writtenTests.userId, user.id))
                .where(await visibleUsers(ctx, input.scope, input.filter))
                .orderBy(desc(writtenTests.takenAt))
                .limit(1);

            return mostRecent[0]?.year ?? null;
        }),

    // Teachers record scores for their own school's students.
    addScore: teacherProcedure
        .input(
            z.object({
                userId: z.string(),
                competition: z.enum([
                    "VCM-1",
                    "VCM-2",
                    "VCM-3",
                    "VCM-4",
                    "invA",
                    "invB",
                    "district",
                    "region",
                    "state",
                ]),
                score: z.number().int().min(0).max(100),
                accuracy: z.number().min(0).max(1).optional(),
                takenAt: z.string().optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { userId, competition, score, accuracy, takenAt } = input;

            const [student] = await db
                .select({ id: user.id })
                .from(user)
                .where(
                    and(
                        eq(user.id, userId),
                        inSchool(user.id, ctx.organizationId),
                    ),
                )
                .limit(1);
            if (!student) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "That student isn't in your school.",
                });
            }

            return await db.insert(writtenTests).values({
                userId,
                competition,
                score,
                accuracy: accuracy ?? 1,
                takenAt: takenAt ?? new Date().toISOString(),
            });
        }),

    // Names and emails of the teacher's school's members.
    getAllUsers: teacherProcedure.query(async ({ ctx }) => {
        const users = await db
            .select({
                id: user.id,
                name: user.name,
                email: user.email,
            })
            .from(user)
            .where(inSchool(user.id, ctx.organizationId))
            .orderBy(asc(user.name));

        return users;
    }),
});
