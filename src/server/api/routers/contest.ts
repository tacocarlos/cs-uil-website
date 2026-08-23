import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { db } from "~/server/db";
import {
    contest,
    contestProblem,
    contestEnrollment,
    contestSubmission,
} from "~/server/db/schema/contest";
import { user } from "~/server/db/schema/auth";
import { eq, desc, asc, sql, and } from "drizzle-orm";
import { getProblemById, fetchUrlContent } from "~/lib/api/lunaghs";
import { distance } from "fastest-levenshtein";

const LEVENSHTEIN_THRESHOLD = 5;

async function executeCode(code: string, languageId: string, stdin = "") {
    const submissionRequest = await fetch(
        "http://judge0.lunaghs.dev/submissions?wait=true",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                source_code: code,
                language_id: languageId,
                stdin,
            }),
        },
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const token = (await submissionRequest.json()).token as string;
    const res = await fetch(`http://judge0.lunaghs.dev/submissions/${token}`);
    return res.json() as Promise<{
        stdout: string | null;
        stderr: string | null;
        time: string;
        memory: number;
        token: string;
        compile_output: string | null;
        status: { id: number; description: string };
    }>;
}

export const contestRouter = createTRPCRouter({
    // ── Queries ────────────────────────────────────────────────────────────────

    getAll: publicProcedure.query(async () => {
        return await db
            .select({
                id: contest.id,
                name: contest.name,
                description: contest.description,
                startsAt: contest.startsAt,
                endsAt: contest.endsAt,
                status: contest.status,
                scoringMode: contest.scoringMode,
                penaltyPoints: contest.penaltyPoints,
                createdAt: contest.createdAt,
                problemCount: sql<number>`count(distinct ${contestProblem.id})::int`,
                participantCount: sql<number>`count(distinct ${contestEnrollment.id})::int`,
            })
            .from(contest)
            .leftJoin(contestProblem, eq(contestProblem.contestId, contest.id))
            .leftJoin(
                contestEnrollment,
                eq(contestEnrollment.contestId, contest.id),
            )
            .groupBy(contest.id)
            .orderBy(desc(contest.createdAt));
    }),

    getById: publicProcedure
        .input(z.object({ contestId: z.number().int() }))
        .query(async ({ input }) => {
            const [contestRows, problems, enrollmentRows] = await Promise.all([
                db
                    .select()
                    .from(contest)
                    .where(eq(contest.id, input.contestId))
                    .limit(1),
                db
                    .select()
                    .from(contestProblem)
                    .where(eq(contestProblem.contestId, input.contestId))
                    .orderBy(asc(contestProblem.displayOrder)),
                db
                    .select({
                        count: sql<number>`count(*)::int`,
                    })
                    .from(contestEnrollment)
                    .where(eq(contestEnrollment.contestId, input.contestId)),
            ]);

            const c = contestRows[0];
            if (!c) return null;

            return {
                ...c,
                problems,
                participantCount: enrollmentRows[0]?.count ?? 0,
            };
        }),

    getEnrollments: publicProcedure
        .input(z.object({ contestId: z.number().int() }))
        .query(async ({ input }) => {
            return await db
                .select({
                    id: contestEnrollment.id,
                    userId: contestEnrollment.userId,
                    userName: user.name,
                    userEmail: user.email,
                    enrolledAt: contestEnrollment.enrolledAt,
                })
                .from(contestEnrollment)
                .innerJoin(user, eq(contestEnrollment.userId, user.id))
                .where(eq(contestEnrollment.contestId, input.contestId))
                .orderBy(asc(contestEnrollment.enrolledAt));
        }),

    isEnrolled: publicProcedure
        .input(z.object({ contestId: z.number().int(), userId: z.string() }))
        .query(async ({ input }) => {
            const rows = await db
                .select({ id: contestEnrollment.id })
                .from(contestEnrollment)
                .where(
                    and(
                        eq(contestEnrollment.contestId, input.contestId),
                        eq(contestEnrollment.userId, input.userId),
                    ),
                )
                .limit(1);
            return rows.length > 0;
        }),

    enroll: publicProcedure
        .input(z.object({ contestId: z.number().int(), userId: z.string() }))
        .mutation(async ({ input }) => {
            const { contestId, userId } = input;
            const existing = await db
                .select({ id: contestEnrollment.id })
                .from(contestEnrollment)
                .where(
                    and(
                        eq(contestEnrollment.contestId, contestId),
                        eq(contestEnrollment.userId, userId),
                    ),
                )
                .limit(1);
            if (existing.length > 0) {
                throw new Error("Already enrolled in this contest");
            }
            const [row] = await db
                .insert(contestEnrollment)
                .values({ contestId, userId })
                .returning();
            return row;
        }),

    getAllSubmissions: publicProcedure
        .input(
            z.object({
                contestId: z.number().int(),
                limit: z.number().int().min(1).max(200).optional(),
                offset: z.number().int().min(0).optional(),
            }),
        )
        .query(async ({ input }) => {
            return await db
                .select({
                    id: contestSubmission.id,
                    apiProblemId: contestSubmission.apiProblemId,
                    userId: contestSubmission.userId,
                    userName: user.name,
                    accepted: contestSubmission.accepted,
                    points: contestSubmission.points,
                    attemptNumber: contestSubmission.attemptNumber,
                    submittedAt: contestSubmission.submittedAt,
                })
                .from(contestSubmission)
                .innerJoin(user, eq(contestSubmission.userId, user.id))
                .where(eq(contestSubmission.contestId, input.contestId))
                .orderBy(desc(contestSubmission.submittedAt))
                .limit(input.limit ?? 50)
                .offset(input.offset ?? 0);
        }),

    getLeaderboard: publicProcedure
        .input(z.object({ contestId: z.number().int() }))
        .query(async ({ input }) => {
            const [submissions, problems] = await Promise.all([
                db
                    .select({
                        userId: contestSubmission.userId,
                        userName: user.name,
                        apiProblemId: contestSubmission.apiProblemId,
                        accepted: contestSubmission.accepted,
                        points: contestSubmission.points,
                        submittedAt: contestSubmission.submittedAt,
                    })
                    .from(contestSubmission)
                    .innerJoin(user, eq(contestSubmission.userId, user.id))
                    .where(
                        and(eq(contestSubmission.contestId, input.contestId)),
                    )
                    .orderBy(asc(contestSubmission.submittedAt)),
                db
                    .select()
                    .from(contestProblem)
                    .where(eq(contestProblem.contestId, input.contestId)),
            ]);

            const labelMap = new Map<number, string>(
                problems.map((p) => [p.apiProblemId, p.label]),
            );

            type ProblemEntry = {
                apiProblemId: number;
                label: string;
                accepted: boolean;
                points: number;
                attempts: number;
            };

            type UserEntry = {
                userId: string;
                userName: string;
                totalPoints: number;
                solvedCount: number;
                lastSolveTime: Date | null;
                problemMap: Map<number, ProblemEntry>;
            };

            const userMap = new Map<string, UserEntry>();

            for (const sub of submissions) {
                if (!userMap.has(sub.userId)) {
                    userMap.set(sub.userId, {
                        userId: sub.userId,
                        userName: sub.userName,
                        totalPoints: 0,
                        solvedCount: 0,
                        lastSolveTime: null,
                        problemMap: new Map(),
                    });
                }

                const userData = userMap.get(sub.userId)!;
                let probEntry = userData.problemMap.get(sub.apiProblemId);
                if (!probEntry) {
                    probEntry = {
                        apiProblemId: sub.apiProblemId,
                        label:
                            labelMap.get(sub.apiProblemId) ??
                            String(sub.apiProblemId),
                        accepted: false,
                        points: 0,
                        attempts: 0,
                    };
                    userData.problemMap.set(sub.apiProblemId, probEntry);
                }

                probEntry.attempts++;

                if (sub.accepted && !probEntry.accepted) {
                    probEntry.accepted = true;
                    probEntry.points = sub.points;
                    userData.totalPoints += sub.points;
                    userData.solvedCount++;
                    userData.lastSolveTime = sub.submittedAt;
                }
            }

            return Array.from(userMap.values())
                .map(({ problemMap, ...rest }) => ({
                    ...rest,
                    problems: Array.from(problemMap.values()),
                }))
                .sort(
                    (a, b) =>
                        b.totalPoints - a.totalPoints ||
                        (a.lastSolveTime?.getTime() ?? 0) -
                            (b.lastSolveTime?.getTime() ?? 0),
                );
        }),

    getMyBestPerProblem: publicProcedure
        .input(
            z.object({
                contestId: z.number().int(),
                userId: z.string(),
            }),
        )
        .query(async ({ input }) => {
            const submissions = await db
                .select()
                .from(contestSubmission)
                .where(
                    and(
                        eq(contestSubmission.contestId, input.contestId),
                        eq(contestSubmission.userId, input.userId),
                    ),
                );

            const best = new Map<number, (typeof submissions)[number]>();

            for (const sub of submissions) {
                const current = best.get(sub.apiProblemId);
                if (!current) {
                    best.set(sub.apiProblemId, sub);
                    continue;
                }
                if (sub.accepted && !current.accepted) {
                    best.set(sub.apiProblemId, sub);
                } else if (
                    sub.accepted === current.accepted &&
                    sub.points > current.points
                ) {
                    best.set(sub.apiProblemId, sub);
                }
            }

            return Array.from(best.values()).map((s) => ({
                apiProblemId: s.apiProblemId,
                accepted: s.accepted,
                points: s.points,
                attemptNumber: s.attemptNumber,
            }));
        }),

    // ── Mutations ──────────────────────────────────────────────────────────────

    create: publicProcedure
        .input(
            z.object({
                name: z.string().min(1),
                description: z.string().default(""),
                startsAt: z.string(),
                endsAt: z.string(),
                scoringMode: z.enum(["simple", "penalty"]),
                penaltyPoints: z.number().int().min(0).optional(),
                createdBy: z.string(),
            }),
        )
        .mutation(async ({ input }) => {
            const rows = await db
                .insert(contest)
                .values({
                    name: input.name,
                    description: input.description,
                    startsAt: new Date(input.startsAt),
                    endsAt: new Date(input.endsAt),
                    scoringMode: input.scoringMode,
                    penaltyPoints: input.penaltyPoints ?? 20,
                    createdBy: input.createdBy,
                })
                .returning();
            return rows[0]!;
        }),

    update: publicProcedure
        .input(
            z.object({
                contestId: z.number().int(),
                name: z.string().min(1).optional(),
                description: z.string().optional(),
                startsAt: z.string().optional(),
                endsAt: z.string().optional(),
                scoringMode: z.enum(["simple", "penalty"]).optional(),
                penaltyPoints: z.number().int().min(0).optional(),
            }),
        )
        .mutation(async ({ input }) => {
            const { contestId, startsAt, endsAt, ...rest } = input;

            const setValues: {
                name?: string;
                description?: string;
                startsAt?: Date;
                endsAt?: Date;
                scoringMode?: "simple" | "penalty";
                penaltyPoints?: number;
            } = {};

            if (rest.name !== undefined) setValues.name = rest.name;
            if (rest.description !== undefined)
                setValues.description = rest.description;
            if (startsAt !== undefined) setValues.startsAt = new Date(startsAt);
            if (endsAt !== undefined) setValues.endsAt = new Date(endsAt);
            if (rest.scoringMode !== undefined)
                setValues.scoringMode = rest.scoringMode;
            if (rest.penaltyPoints !== undefined)
                setValues.penaltyPoints = rest.penaltyPoints;

            if (Object.keys(setValues).length === 0) return null;

            const rows = await db
                .update(contest)
                .set(setValues)
                .where(eq(contest.id, contestId))
                .returning();
            return rows[0] ?? null;
        }),

    setStatus: publicProcedure
        .input(
            z.object({
                contestId: z.number().int(),
                status: z.enum([
                    "draft",
                    "scheduled",
                    "active",
                    "frozen",
                    "ended",
                ]),
            }),
        )
        .mutation(async ({ input }) => {
            const rows = await db
                .update(contest)
                .set({ status: input.status })
                .where(eq(contest.id, input.contestId))
                .returning();
            return rows[0] ?? null;
        }),

    delete: publicProcedure
        .input(z.object({ contestId: z.number().int() }))
        .mutation(async ({ input }) => {
            await db.delete(contest).where(eq(contest.id, input.contestId));
        }),

    addProblem: publicProcedure
        .input(
            z.object({
                contestId: z.number().int(),
                apiProblemId: z.number().int(),
                label: z.string(),
                maxPoints: z.number().int().min(0),
                displayOrder: z.number().int().min(0),
            }),
        )
        .mutation(async ({ input }) => {
            const rows = await db
                .insert(contestProblem)
                .values({
                    contestId: input.contestId,
                    apiProblemId: input.apiProblemId,
                    label: input.label,
                    maxPoints: input.maxPoints,
                    displayOrder: input.displayOrder,
                })
                .returning();
            return rows[0]!;
        }),

    removeProblem: publicProcedure
        .input(z.object({ contestProblemId: z.number().int() }))
        .mutation(async ({ input }) => {
            await db
                .delete(contestProblem)
                .where(eq(contestProblem.id, input.contestProblemId));
        }),

    updateProblem: publicProcedure
        .input(
            z.object({
                contestProblemId: z.number().int(),
                label: z.string().optional(),
                maxPoints: z.number().int().min(0).optional(),
            }),
        )
        .mutation(async ({ input }) => {
            const setValues: { label?: string; maxPoints?: number } = {};
            if (input.label !== undefined) setValues.label = input.label;
            if (input.maxPoints !== undefined)
                setValues.maxPoints = input.maxPoints;

            if (Object.keys(setValues).length === 0) return null;

            const rows = await db
                .update(contestProblem)
                .set(setValues)
                .where(eq(contestProblem.id, input.contestProblemId))
                .returning();
            return rows[0] ?? null;
        }),

    submitCode: publicProcedure
        .input(
            z.object({
                contestId: z.number().int(),
                apiProblemId: z.number().int(),
                userId: z.string(),
                code: z.string(),
                languageId: z.string(),
            }),
        )
        .mutation(async ({ input }) => {
            const {
                contestId: cId,
                apiProblemId,
                userId,
                code,
                languageId,
            } = input;

            // Verify the contest is active
            const contestRows = await db
                .select()
                .from(contest)
                .where(eq(contest.id, cId))
                .limit(1);
            const contestRow = contestRows[0];
            if (!contestRow) throw new Error(`Contest ${cId} not found`);
            if (contestRow.status !== "active")
                throw new Error("Contest is not active");

            // Count prior submissions for attempt number
            const priorSubmissions = await db
                .select()
                .from(contestSubmission)
                .where(
                    and(
                        eq(contestSubmission.contestId, cId),
                        eq(contestSubmission.apiProblemId, apiProblemId),
                        eq(contestSubmission.userId, userId),
                    ),
                );
            const attemptNumber = priorSubmissions.length + 1;

            // Fetch problem test data from external API
            const apiResult = await getProblemById(apiProblemId);
            if (!apiResult.success || !apiResult.problem) {
                throw new Error(
                    `Failed to fetch problem ${apiProblemId} from API`,
                );
            }
            const [testInput, testOutput] = await Promise.all([
                fetchUrlContent(apiResult.problem.test_data_url),
                fetchUrlContent(apiResult.problem.test_output_url),
            ]);
            const normalizedTestOutput = testOutput.replaceAll("\r", "");

            // Execute code against the test input
            const result = await executeCode(code, languageId, testInput);

            // Grade via Levenshtein distance
            const dist = distance(result.stdout ?? "", normalizedTestOutput);
            const accepted = dist < LEVENSHTEIN_THRESHOLD;

            // Compute points based on scoring mode
            const cpRows = await db
                .select({ maxPoints: contestProblem.maxPoints })
                .from(contestProblem)
                .where(
                    and(
                        eq(contestProblem.contestId, cId),
                        eq(contestProblem.apiProblemId, apiProblemId),
                    ),
                )
                .limit(1);
            const maxPoints = cpRows[0]?.maxPoints ?? 60;
            const wrongAttempts = priorSubmissions.filter(
                (s) => !s.accepted,
            ).length;
            const points =
                contestRow.scoringMode === "penalty"
                    ? accepted
                        ? Math.max(
                              0,
                              maxPoints -
                                  wrongAttempts * contestRow.penaltyPoints,
                          )
                        : 0
                    : accepted
                      ? maxPoints
                      : 0;

            // Only persist if not already accepted
            const alreadyAccepted = priorSubmissions.some((s) => s.accepted);
            if (!alreadyAccepted) {
                await db.insert(contestSubmission).values({
                    contestId: cId,
                    apiProblemId,
                    userId,
                    languageId,
                    submittedCode: code,
                    accepted,
                    points,
                    attemptNumber,
                });
            }

            return {
                accepted,
                points,
                attemptNumber,
                stdout: result.stdout,
                stderr: result.stderr,
                compileOutput: result.compile_output,
                status: result.status,
            };
        }),
});
