import z from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, teacherProcedure } from "../trpc";
import { db } from "~/server/db";
import { writtenTests } from "~/server/db/schema/written";
import { user } from "~/server/db/schema/auth";
import { eq, and, desc, isNotNull, isNull, asc } from "drizzle-orm";
import { inSchool } from "~/server/organizations";
import { member } from "~/server/db/schema/organization";
import { computeWrittenStatistics } from "~/lib/written/statistics";

const competitionInput = z.enum(writtenTests.competition.enumValues);

/** Former students are left out unless asked for (e.g. to see trends). */
const includeFormerInput = z.boolean().default(false);

/**
 * Written scores of a school's students with their names and whether
 * they're former students, for ranking and statistics.
 */
function schoolScores(
    organizationId: string,
    includeFormer: boolean,
    ...conditions: Parameters<typeof and>
) {
    return db
        .select({
            userId: user.id,
            name: user.name,
            score: writtenTests.score,
            formerAt: member.formerAt,
        })
        .from(writtenTests)
        .innerJoin(user, eq(writtenTests.userId, user.id))
        .innerJoin(
            member,
            and(
                eq(member.userId, user.id),
                eq(member.organizationId, organizationId),
            ),
        )
        .where(
            and(
                includeFormer ? undefined : isNull(member.formerAt),
                ...conditions,
            ),
        );
}

// Written test scores are for teachers only: they record their own
// school's students' scores and see them ranked. Students don't see a
// written leaderboard; the site's public focus is the programming section.
// Teachers see all their students, whatever the students' leaderboard
// privacy setting (which is about what other students see).
export const writtenRouter = createTRPCRouter({
    /** The teacher's students ranked by total written score. */
    getLeaderboard: teacherProcedure
        .input(
            z.object({
                competition: competitionInput.optional(),
                year: z.number().int().optional(),
                includeFormer: includeFormerInput,
            }),
        )
        .query(async ({ ctx, input }) => {
            const { competition, year } = input;
            const tests = await schoolScores(
                ctx.organizationId,
                input.includeFormer,
                competition
                    ? eq(writtenTests.competition, competition)
                    : undefined,
                year ? eq(writtenTests.seasonYear, year) : undefined,
            );

            // Aggregate scores by user
            const scoreMap = new Map<
                string,
                { name: string; totalScore: number; former: boolean }
            >();
            for (const test of tests) {
                const current = scoreMap.get(test.userId);
                scoreMap.set(test.userId, {
                    name: test.name,
                    totalScore: (current?.totalScore ?? 0) + test.score,
                    former: test.formerAt !== null,
                });
            }

            // Convert to array and sort by score descending
            return Array.from(scoreMap.entries())
                .map(([id, data]) => ({
                    id,
                    name: data.name,
                    score: data.totalScore,
                    former: data.former,
                }))
                .sort((a, b) => b.score - a.score);
        }),

    /** Competitions the teacher's students have scores for. */
    getAvailableCompetitions: teacherProcedure
        .input(
            z.object({
                year: z.number().int().optional(),
                includeFormer: includeFormerInput,
            }),
        )
        .query(async ({ ctx, input }) => {
            const conditions = [
                inSchool(writtenTests.userId, ctx.organizationId, {
                    currentOnly: !input.includeFormer,
                }),
                isNotNull(writtenTests.competition),
            ];
            if (input.year !== undefined) {
                conditions.push(eq(writtenTests.seasonYear, input.year));
            }

            const competitions = await db
                .selectDistinct({ competition: writtenTests.competition })
                .from(writtenTests)
                .where(and(...conditions));

            return competitions
                .map((c) => c.competition)
                .filter((c) => c !== null)
                .sort();
        }),

    /** The competition with the teacher's students' most recent score. */
    getMostRecentCompetition: teacherProcedure
        .input(
            z.object({
                year: z.number().int().optional(),
                includeFormer: includeFormerInput,
            }),
        )
        .query(async ({ ctx, input }) => {
            const conditions = [
                inSchool(writtenTests.userId, ctx.organizationId, {
                    currentOnly: !input.includeFormer,
                }),
                isNotNull(writtenTests.competition),
            ];
            if (input.year !== undefined) {
                conditions.push(eq(writtenTests.seasonYear, input.year));
            }

            const [mostRecent] = await db
                .select({ competition: writtenTests.competition })
                .from(writtenTests)
                .where(and(...conditions))
                .orderBy(desc(writtenTests.takenAt))
                .limit(1);
            return mostRecent?.competition ?? null;
        }),

    /**
     * Season years the teacher's students (former ones too) have scores
     * for, newest first.
     */
    getAvailableYears: teacherProcedure.query(async ({ ctx }) => {
        const years = await db
            .selectDistinct({ year: writtenTests.seasonYear })
            .from(writtenTests)
            .where(inSchool(writtenTests.userId, ctx.organizationId))
            .orderBy(desc(writtenTests.seasonYear));
        return years.map((y) => y.year);
    }),

    /**
     * Optimal (best) and expected (average) scores per student, and the
     * school's top-3 totals, over one season year or, without a year, each
     * student's whole participation (src/lib/written/statistics.ts).
     */
    getStatistics: teacherProcedure
        .input(
            z.object({
                year: z.number().int().optional(),
                includeFormer: includeFormerInput,
            }),
        )
        .query(async ({ ctx, input }) => {
            const scores = await schoolScores(
                ctx.organizationId,
                input.includeFormer,
                input.year === undefined
                    ? undefined
                    : eq(writtenTests.seasonYear, input.year),
            );
            return computeWrittenStatistics(
                scores.map(({ formerAt, ...s }) => ({
                    ...s,
                    former: formerAt !== null,
                })),
            );
        }),

    // Teachers record scores for their own school's students.
    addScore: teacherProcedure
        .input(
            z.object({
                userId: z.string(),
                competition: competitionInput,
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

    // Names and emails of the teacher's school's current members, for
    // picking whose score to record.
    getAllUsers: teacherProcedure.query(async ({ ctx }) => {
        const users = await db
            .select({
                id: user.id,
                name: user.name,
                email: user.email,
            })
            .from(user)
            .where(inSchool(user.id, ctx.organizationId, { currentOnly: true }))
            .orderBy(asc(user.name));

        return users;
    }),
});
