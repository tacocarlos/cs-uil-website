import { z } from "zod";

export const formSchema = z.object({
    problemName: z.string(),
    competitionYear: z.number().int(),
    competitionLevel: z.enum([
        "invA",
        "invB",
        "district",
        "region",
        "state",
        "custom",
    ]),
    problemText: z.string(),
    programName: z.string(),
    inputFileName: z.string().optional(),
    defaultInputFile: z.string().optional(),
    testInput: z.string().default(""),
    testOutput: z.string().default(""),
});
