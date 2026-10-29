import z from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, teacherProcedure } from "../trpc";
import { db } from "~/server/db";
import { writtenTests } from "~/server/db/schema/written";
import { user } from "~/server/db/schema/auth";
import { eq, and, isNull, asc } from "drizzle-orm";
import { inSchool } from "~/server/organizations";
import {
    mostRecentWrittenCompetition,
    writtenCompetitions,
    writtenYears,
} from "~/server/written";
import { member } from "~/server/db/schema/organization";
import { totalWrittenScores } from "~/lib/written/leaderboard";
import { computeWrittenStatistics } from "~/lib/written/statistics";
import { seasonYearOf } from "~/lib/written/season";

const competitionInput = z.enum(writtenTests.competition.enumValues);

/** Former students are left out unless asked for (e.g. to see trends). */
const includeFormerInput = z.boolean().default(false);

/** One season year (every season without one), and whether to include former students. */
const seasonInput = z.object({
    year: z.number().int().optional(),
    includeFormer: includeFormerInput,
});

/** The school's students' tests, from one season year if given. */
function schoolTests(
    organizationId: string,
    { year, includeFormer }: { year?: number; includeFormer: boolean },
) {
    return and(
        inSchool(writtenTests.userId, organizationId, {
            currentOnly: !includeFormer,
        }),
        year === undefined ? undefined : eq(writtenTests.seasonYear, year),
    );
}

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
            accuracy: writtenTests.accuracy,
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

// Teachers record their own school's students' written scores and see them
// ranked here. They see all their students, whatever the students'
// leaderboard privacy setting (which is about what other students see);
// the public written leaderboard (src/app/leaderboard/written) respects it.
export const writtenRouter = createTRPCRouter({
    /**
     * The teacher's students ranked by total written score, then average
     * accuracy.
     */
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
            return totalWrittenScores(
                tests.map(({ formerAt, ...test }) => ({
                    ...test,
                    former: formerAt !== null,
                })),
            );
        }),

    /** Competitions the teacher's students have scores for. */
    getAvailableCompetitions: teacherProcedure
        .input(seasonInput)
        .query(({ ctx, input }) =>
            writtenCompetitions(schoolTests(ctx.organizationId, input)),
        ),

    /** The competition with the teacher's students' most recent score. */
    getMostRecentCompetition: teacherProcedure
        .input(seasonInput)
        .query(({ ctx, input }) =>
            mostRecentWrittenCompetition(
                schoolTests(ctx.organizationId, input),
            ),
        ),

    /**
     * Season years the teacher's students (former ones too) have scores
     * for, newest first.
     */
    getAvailableYears: teacherProcedure.query(({ ctx }) =>
        writtenYears(inSchool(writtenTests.userId, ctx.organizationId)),
    ),

    /**
     * Optimal (best) and expected (average) scores per student, and the
     * school's top-3 totals, over one season year or, without a year, each
     * student's whole participation (src/lib/written/statistics.ts).
     */
    getStatistics: teacherProcedure
        .input(seasonInput)
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

            const date = takenAt ?? new Date().toISOString();
            return await db.insert(writtenTests).values({
                userId,
                competition,
                score,
                accuracy: accuracy ?? 1,
                takenAt: date,
                // The season the test was taken in, not the one it's
                // recorded in.
                seasonYear: seasonYearOf(date),
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
