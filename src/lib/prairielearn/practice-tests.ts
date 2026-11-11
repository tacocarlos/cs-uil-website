/**
 * PrairieLearn practice tests (see src/server/prairielearn/). Kept free of
 * server imports so client components can use it.
 */

/**
 * The contest level of a practice test, from a title like
 * "District Practice Test" ("District"), or null for any other assessment.
 */
export function practiceTestLevel(title: string): string | null {
    const match = /^\s*(.+?)\s+practice test\s*$/i.exec(title);
    return match?.[1] ?? null;
}

/**
 * Whether a PrairieLearn UID is the pseudonymous kind given to students who
 * come in through an LMS (LTI), like "<hash>::ciid=8", rather than an email.
 */
export function isLtiUid(uid: string): boolean {
    return uid.includes("::");
}

// ── UIL scoring ──────────────────────────────────────────────────────────────

/** UIL written-test points per question: wrong answers cost points. */
export const UIL_POINTS = { correct: 6, wrong: -2, skipped: 0 } as const;

export type QuestionOutcome = keyof typeof UIL_POINTS;

/** How many of an attempt's questions were right, wrong, and skipped. */
export type UilTally = Record<QuestionOutcome, number>;

/**
 * A question's outcome from PrairieLearn: skipped if never submitted,
 * otherwise judged by the last submission, as an answer sheet would be.
 */
export function questionOutcome(question: {
    numberAttempts: number | null;
    lastSubmissionScore: number | null;
}): QuestionOutcome {
    if (!question.numberAttempts) return "skipped";
    return (question.lastSubmissionScore ?? 0) >= 1 ? "correct" : "wrong";
}

export function tallyOutcomes(outcomes: readonly QuestionOutcome[]): UilTally {
    const tally: UilTally = { correct: 0, wrong: 0, skipped: 0 };
    for (const outcome of outcomes) tally[outcome]++;
    return tally;
}

/** +6 per correct answer, −2 per wrong one, 0 per skipped one. */
export function uilScore({ correct, wrong, skipped }: UilTally): number {
    return (
        correct * UIL_POINTS.correct +
        wrong * UIL_POINTS.wrong +
        skipped * UIL_POINTS.skipped
    );
}

/** The best possible score: every question right. */
export function uilMaxScore({ correct, wrong, skipped }: UilTally): number {
    return (correct + wrong + skipped) * UIL_POINTS.correct;
}

// ── Ranking ──────────────────────────────────────────────────────────────────

export type PracticeAttempt = UilTally & {
    userId: string;
    name: string;
    startedAt: Date;
};

export type PracticeRanking = {
    userId: string;
    name: string;
    rank: number;
    /** The best attempt (earliest, among equally good ones). */
    best: PracticeAttempt;
    /** Its UIL score. */
    score: number;
    attempts: number;
};

/** Whether attempt `a` beats `b`: a higher score, or the same score sooner. */
function beats(a: PracticeAttempt, b: PracticeAttempt): boolean {
    const diff = uilScore(a) - uilScore(b);
    return (
        diff > 0 ||
        (diff === 0 && a.startedAt.getTime() < b.startedAt.getTime())
    );
}

/**
 * Each student's best attempt by UIL score, best first: by score, then
 * whoever got it first, then name. Students with the same score share a
 * rank. Attempts from several PrairieLearn users linked to one account
 * count as one student's.
 */
export function rankPracticeScores(
    attempts: readonly PracticeAttempt[],
): PracticeRanking[] {
    const byUser = new Map<
        string,
        { best: PracticeAttempt; attempts: number }
    >();
    for (const attempt of attempts) {
        const entry = byUser.get(attempt.userId);
        if (!entry) {
            byUser.set(attempt.userId, { best: attempt, attempts: 1 });
        } else {
            entry.attempts++;
            if (beats(attempt, entry.best)) entry.best = attempt;
        }
    }

    const sorted = [...byUser.values()]
        .map((entry) => ({ ...entry, score: uilScore(entry.best) }))
        .sort(
            (a, b) =>
                b.score - a.score ||
                a.best.startedAt.getTime() - b.best.startedAt.getTime() ||
                a.best.name.localeCompare(b.best.name),
        );

    let rank = 0;
    return sorted.map((entry, i) => {
        if (i === 0 || entry.score !== sorted[i - 1]!.score) rank = i + 1;
        return {
            userId: entry.best.userId,
            name: entry.best.name,
            rank,
            best: entry.best,
            score: entry.score,
            attempts: entry.attempts,
        };
    });
}

// ── Dates ────────────────────────────────────────────────────────────────────

/** UIL is in Texas; dates are shown in its time, wherever they're made. */
const TIME_ZONE = "America/Chicago";

/** "Nov 10, 2026". */
export function formatPracticeDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
        timeZone: TIME_ZONE,
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

/** "Nov 10, 4:25 PM". */
export function formatPracticeTime(date: Date): string {
    return date.toLocaleString("en-US", {
        timeZone: TIME_ZONE,
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}
