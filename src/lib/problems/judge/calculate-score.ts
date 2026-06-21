export type ScoringType = "UIL" | "LENIENT" | "NO_PENALTY";

const Penalty: Record<ScoringType, number> = {
    UIL: 5,
    LENIENT: 1,
    NO_PENALTY: 0,
};

type ScoreOptions = {
    maxPoints: number;
    scoringType: ScoringType;
};

const DefaultScoreOptions: ScoreOptions = {
    maxPoints: 60,
    scoringType: "LENIENT",
};

export default function CalculateScore(
    numberAttemps: number,
    options?: ScoreOptions,
) {
    const p = Penalty[options?.scoringType ?? DefaultScoreOptions.scoringType];
    return (
        (options?.maxPoints ?? DefaultScoreOptions.maxPoints) -
        p * (numberAttemps - 1)
    );
}
