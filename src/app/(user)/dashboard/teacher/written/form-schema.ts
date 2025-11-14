import { z } from "zod";

export const CompetitionEnum = z.enum([
    "VCM-1",
    "VCM-2",
    "VCM-3",
    "VCM-4",
    "invA",
    "invB",
    "district",
    "region",
    "state",
]);

export const writtenScoreFormSchema = z.object({
    userId: z.string().min(1, "Please select a user"),
    competition: CompetitionEnum,
    score: z
        .number()
        .int()
        .min(0, "Score must be at least 0")
        .max(100, "Score must be at most 100"),
    accuracy: z.number().min(0).max(1).optional(),
    takenAt: z.string().optional(),
});

export type Competition = z.infer<typeof CompetitionEnum>;
