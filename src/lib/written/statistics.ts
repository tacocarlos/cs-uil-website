/**
 * Written test statistics for a school over a period (one season year, or
 * a student's whole participation).
 *
 * Per student:
 * - optimal: their best score in the period
 * - expected: their average score in the period
 *
 * Per school, following UIL team scoring (a team's written score is its
 * top three individual scores added together):
 * - optimal: the three best student optimals, summed
 * - expected: the three best student expecteds, summed
 */

/** Written scores that count toward a UIL team score. */
export const TEAM_SIZE = 3;

export type WrittenScore = {
    userId: string;
    name: string;
    score: number;
    /** A former student (graduated or left); shown as such. */
    former?: boolean;
};

export type StudentStatistics = {
    userId: string;
    name: string;
    former: boolean;
    tests: number;
    optimal: number;
    expected: number;
};

export type TeamStatistic = {
    total: number;
    /** The students whose scores were added up, best first. */
    counted: { userId: string; name: string; former: boolean; score: number }[];
};

export type WrittenStatistics = {
    /** Students with at least one score, best optimal first. */
    students: StudentStatistics[];
    school: { optimal: TeamStatistic; expected: TeamStatistic };
};

function teamOf(
    students: StudentStatistics[],
    metric: "optimal" | "expected",
): TeamStatistic {
    const counted = [...students]
        .sort((a, b) => b[metric] - a[metric] || a.name.localeCompare(b.name))
        .slice(0, TEAM_SIZE)
        .map((s) => ({
            userId: s.userId,
            name: s.name,
            former: s.former,
            score: s[metric],
        }));
    return {
        total: counted.reduce((sum, s) => sum + s.score, 0),
        counted,
    };
}

export function computeWrittenStatistics(
    scores: WrittenScore[],
): WrittenStatistics {
    const byStudent = new Map<
        string,
        { name: string; former: boolean; scores: number[] }
    >();
    for (const { userId, name, score, former = false } of scores) {
        const entry = byStudent.get(userId) ?? { name, former, scores: [] };
        entry.scores.push(score);
        byStudent.set(userId, entry);
    }

    const students = Array.from(byStudent, ([userId, entry]) => ({
        userId,
        name: entry.name,
        former: entry.former,
        tests: entry.scores.length,
        optimal: Math.max(...entry.scores),
        expected: entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length,
    })).sort(
        (a, b) =>
            b.optimal - a.optimal ||
            b.expected - a.expected ||
            a.name.localeCompare(b.name),
    );

    return {
        students,
        school: {
            optimal: teamOf(students, "optimal"),
            expected: teamOf(students, "expected"),
        },
    };
}
