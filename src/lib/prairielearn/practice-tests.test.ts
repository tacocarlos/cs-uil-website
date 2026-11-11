import { describe, expect, test } from "vitest";
import {
    formatPracticeDate,
    formatPracticeTime,
    isLtiUid,
    practiceTestLevel,
    questionOutcome,
    rankPracticeScores,
    tallyOutcomes,
    uilMaxScore,
    uilScore,
    type PracticeAttempt,
} from "./practice-tests";

describe("practiceTestLevel", () => {
    test.each([
        ["District Practice Test", "District"],
        ["Invitational A Practice Test", "Invitational A"],
        ["  State practice test ", "State"],
    ])("%s is %s", (title, level) => {
        expect(practiceTestLevel(title)).toBe(level);
    });

    test.each(["Number Bases", "Practice Test", "District Practice Test 2"])(
        "%s isn't a practice test",
        (title) => {
            expect(practiceTestLevel(title)).toBeNull();
        },
    );
});

test("isLtiUid", () => {
    expect(isLtiUid("e5c89e6d07b4::ciid=8")).toBe(true);
    expect(isLtiUid("student@school.net")).toBe(false);
});

describe("UIL scoring", () => {
    test.each([
        [0, null, "skipped"],
        [null, null, "skipped"],
        [1, 1, "correct"],
        [1, 0, "wrong"],
        // Judged by the last submission, like an answer sheet.
        [2, 1, "correct"],
        [2, 0, "wrong"],
        // Submitted but never graded counts as wrong.
        [1, null, "wrong"],
    ] as const)(
        "%s submissions, last scoring %s, is %s",
        (numberAttempts, lastSubmissionScore, outcome) => {
            expect(
                questionOutcome({ numberAttempts, lastSubmissionScore }),
            ).toBe(outcome);
        },
    );

    test("+6 correct, -2 wrong, 0 skipped", () => {
        const tally = tallyOutcomes([
            ...Array<"correct">(9).fill("correct"),
            "wrong",
            ...Array<"skipped">(5).fill("skipped"),
        ]);
        expect(tally).toEqual({ correct: 9, wrong: 1, skipped: 5 });
        expect(uilScore(tally)).toBe(52);
        expect(uilMaxScore(tally)).toBe(90);
    });

    test("guessing everything wrong goes negative", () => {
        expect(uilScore({ correct: 0, wrong: 15, skipped: 0 })).toBe(-30);
    });
});

/** An attempt with `correct` right and `wrong` wrong out of 15. */
function attempt(
    userId: string,
    correct: number,
    wrong: number,
    day: number,
): PracticeAttempt {
    return {
        userId,
        name: userId.toUpperCase(),
        correct,
        wrong,
        skipped: 15 - correct - wrong,
        startedAt: new Date(2026, 10, day),
    };
}

describe("rankPracticeScores", () => {
    test("ranks each student by their best UIL score", () => {
        const ranked = rankPracticeScores([
            attempt("a", 5, 0, 1), // 30
            attempt("b", 8, 6, 2), // 36
            attempt("a", 7, 0, 3), // 42
            attempt("a", 9, 9, 4), // 36: more right, but not better
        ]);
        expect(ranked.map((r) => [r.userId, r.rank, r.score])).toEqual([
            ["a", 1, 42],
            ["b", 2, 36],
        ]);
        expect(ranked[0]!.attempts).toBe(3);
        expect(ranked[1]!.attempts).toBe(1);
    });

    test("wrong answers can rank below skipping", () => {
        const ranked = rankPracticeScores([
            attempt("guesser", 3, 12, 1), // -6
            attempt("blank", 0, 0, 2), // 0
        ]);
        expect(ranked.map((r) => [r.userId, r.score])).toEqual([
            ["blank", 0],
            ["guesser", -6],
        ]);
    });

    test("ties share a rank, ordered by who scored first", () => {
        const ranked = rankPracticeScores([
            attempt("late", 5, 0, 9),
            attempt("early", 5, 0, 2),
            attempt("low", 2, 0, 1),
        ]);
        expect(ranked.map((r) => [r.userId, r.rank])).toEqual([
            ["early", 1],
            ["late", 1],
            ["low", 3],
        ]);
    });

    test("keeps the earliest of equally good attempts", () => {
        const [only] = rankPracticeScores([
            attempt("a", 6, 0, 5),
            attempt("a", 6, 0, 3),
        ]);
        expect(only!.best.startedAt).toEqual(new Date(2026, 10, 3));
    });

    test("no attempts, no rankings", () => {
        expect(rankPracticeScores([])).toEqual([]);
    });
});

test("dates are in Texas time", () => {
    // 3:30 AM UTC on Nov 11 is still Nov 10 in Texas.
    const date = new Date("2026-11-11T03:30:00Z");
    expect(formatPracticeDate(date)).toBe("Nov 10, 2026");
    expect(formatPracticeTime(date)).toBe("Nov 10, 9:30 PM");
});
