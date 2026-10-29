import { and, asc, eq } from "drizzle-orm";
import { columnsToCsv, type CsvColumn } from "~/lib/csv";
import {
    competitionLevel,
    getAllCompetitions,
    getAllMinimalProblems,
} from "~/lib/api/lunaghs";
import { fetchJudge0Languages } from "~/lib/problems/execute/judge0";
import { FALLBACK_LANGUAGES } from "~/components/problem-workspace/languages";
import { competitionLabel } from "~/lib/written/competitions";
import { COMPETITION_LEVEL_LABELS } from "~/lib/problems/competition-levels";
import { db } from "~/server/db";
import { user } from "~/server/db/schema/auth";
import { contest, contestSubmission } from "~/server/db/schema/contest";
import { member } from "~/server/db/schema/organization";
import { submission } from "~/server/db/schema/submission";
import { writtenTests } from "~/server/db/schema/written";

export const EXPORT_KINDS = ["written", "programming"] as const;
export type ExportKind = (typeof EXPORT_KINDS)[number];

/**
 * The school's membership rows joined to a user ID column: limits a query
 * to the school's students (former ones too, flagged in the export) and
 * gives their former-student date.
 */
function schoolMember(userId: typeof user.id, organizationId: string) {
    return and(
        eq(member.userId, userId),
        eq(member.organizationId, organizationId),
    );
}

/** The first columns of every export: who the row is about. */
const studentColumns: CsvColumn<{
    name: string;
    email: string;
    formerAt: Date | null;
}>[] = [
    { header: "Student", value: (r) => r.name },
    { header: "Email", value: (r) => r.email },
    { header: "Former student", value: (r) => r.formerAt !== null },
];

/**
 * Every written test score of the school's students, current and former,
 * whatever their leaderboard privacy setting (teachers see all of their
 * students' scores).
 */
export async function writtenScoresCsv(organizationId: string) {
    const rows = await db
        .select({
            name: user.name,
            email: user.email,
            formerAt: member.formerAt,
            competition: writtenTests.competition,
            seasonYear: writtenTests.seasonYear,
            takenAt: writtenTests.takenAt,
            score: writtenTests.score,
            accuracy: writtenTests.accuracy,
        })
        .from(writtenTests)
        .innerJoin(user, eq(writtenTests.userId, user.id))
        .innerJoin(member, schoolMember(user.id, organizationId))
        .orderBy(asc(user.name), asc(writtenTests.takenAt));

    return columnsToCsv<(typeof rows)[number]>(
        [
            ...studentColumns,
            {
                header: "Competition",
                value: (r) => r.competition && competitionLabel(r.competition),
            },
            { header: "Season", value: (r) => r.seasonYear },
            { header: "Date taken", value: (r) => r.takenAt },
            { header: "Score", value: (r) => r.score },
            { header: "Accuracy", value: (r) => r.accuracy },
        ],
        rows,
    );
}

/**
 * Judge0 language names by ID, e.g. "Java (OpenJDK 13.0.1)" for "62". Uses
 * the app's built-in list when Judge0 can't be reached.
 */
async function languageNames(): Promise<Map<string, string>> {
    const languages = await fetchJudge0Languages().catch(
        () => FALLBACK_LANGUAGES,
    );
    return new Map(languages.map((l) => [l.id, l.name]));
}

/**
 * Every programming submission of the school's students, current and
 * former: practice submissions and contest submissions, oldest first per
 * student. Submitted code is left out.
 */
export async function programmingSubmissionsCsv(organizationId: string) {
    const [practice, contestRows, problems, competitions, languages] =
        await Promise.all([
            db
                .select({
                    name: user.name,
                    email: user.email,
                    formerAt: member.formerAt,
                    problemId: submission.problemId,
                    submittedAt: submission.timeSubmitted,
                    attempt: submission.attemptNumber,
                    accepted: submission.accepted,
                    points: submission.points,
                    maxPoints: submission.maxPoints,
                })
                .from(submission)
                .innerJoin(user, eq(submission.userId, user.id))
                .innerJoin(member, schoolMember(user.id, organizationId)),
            db
                .select({
                    name: user.name,
                    email: user.email,
                    formerAt: member.formerAt,
                    contestName: contest.name,
                    problemId: contestSubmission.apiProblemId,
                    submittedAt: contestSubmission.submittedAt,
                    attempt: contestSubmission.attemptNumber,
                    accepted: contestSubmission.accepted,
                    points: contestSubmission.points,
                    language: contestSubmission.languageId,
                })
                .from(contestSubmission)
                .innerJoin(user, eq(contestSubmission.userId, user.id))
                .innerJoin(member, schoolMember(user.id, organizationId))
                .innerJoin(
                    contest,
                    eq(contestSubmission.contestId, contest.id),
                ),
            getAllMinimalProblems(),
            getAllCompetitions(),
            languageNames(),
        ]);

    const problemById = new Map(problems.map((p) => [p.id, p]));
    const competitionById = new Map(competitions.map((c) => [c.id, c]));
    // Blank if the problem API is unavailable.
    const problemName = (problemId: number) => problemById.get(problemId)?.name;
    // e.g. "District 2019".
    function competitionName(problemId: number) {
        const problem = problemById.get(problemId);
        const competition =
            problem && competitionById.get(problem.competitionId);
        return (
            competition &&
            `${COMPETITION_LEVEL_LABELS[competitionLevel(competition)]} ${competition.year}`
        );
    }

    const rows = [
        ...practice.map((r) => ({
            ...r,
            source: "Practice",
            language: null,
        })),
        ...contestRows.map((r) => ({
            ...r,
            source: r.contestName,
            language: languages.get(r.language) ?? r.language,
            // Contest submissions don't record a maximum.
            maxPoints: null,
        })),
    ].sort(
        (a, b) =>
            a.name.localeCompare(b.name) ||
            a.submittedAt.getTime() - b.submittedAt.getTime(),
    );

    return columnsToCsv<(typeof rows)[number]>(
        [
            ...studentColumns,
            { header: "Source", value: (r) => r.source },
            { header: "Problem ID", value: (r) => r.problemId },
            { header: "Problem", value: (r) => problemName(r.problemId) },
            {
                header: "Competition",
                value: (r) => competitionName(r.problemId),
            },
            { header: "Submitted at", value: (r) => r.submittedAt },
            { header: "Attempt", value: (r) => r.attempt },
            { header: "Accepted", value: (r) => r.accepted === true },
            { header: "Points", value: (r) => r.points },
            { header: "Max points", value: (r) => r.maxPoints },
            { header: "Language", value: (r) => r.language },
        ],
        rows,
    );
}
