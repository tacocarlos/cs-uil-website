import { z } from "zod";
import { db } from "~/server/db";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { problems } from "~/server/db/schema/problem";
import { eq } from "drizzle-orm";

export const problemRouter = createTRPCRouter({
    addProblem: publicProcedure
        .input(
            z.object({
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
            }),
        )
        .mutation(async (opts) => {
            const values = opts.input;
            return db.insert(problems).values(values);
        }),

    setProblemStatus: publicProcedure
        .input(z.object({ id: z.number().int(), enabled: z.boolean() }))
        .mutation(async (opts) => {
            const { id, enabled } = opts.input;
            return db
                .update(problems)
                .set({ enabled })
                .where(eq(problems.id, id));
        }),
});
