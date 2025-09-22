import { z } from "zod";

export const CompetitionLevelEnum = z.enum([
    "invA",
    "invB",
    "district",
    "region",
    "state",
    "custom",
]);

export const formSchema = z.object({
    problemName: z.string(),
    competitionYear: z.coerce.number().int() as z.ZodNumber,
    competitionLevel: CompetitionLevelEnum,
    problemText: z.string(),
    programName: z.string(),
    inputFileName: z.string(),
    defaultInputFile: z.string(),
    sampleOutput: z.string(),
    testInput: z.string(),
    testOutput: z.string(),
    enabled: z.boolean(),
    code: z.string(),
});

export type CompetitionLevel = z.infer<typeof CompetitionLevelEnum>;
