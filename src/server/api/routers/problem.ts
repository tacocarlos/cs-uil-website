import z from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
    getAllAppProblems,
    getAllMinimalProblems,
    getProblemById as API_getProblemById,
    getProblemMarkdown,
    fetchUrlContent,
} from "~/lib/api/lunaghs";

export const problemRouter = createTRPCRouter({
    getProblems: publicProcedure.query(async () => {
        return getAllAppProblems();
    }),

    /** Lightweight list — only id, name, number, competition_id. Use this in
     *  client components instead of calling getAllMinimalProblems() directly,
     *  which would fire from the browser and hit CORS. */
    getMinimalProblems: publicProcedure.query(async () => {
        return getAllMinimalProblems();
    }),

    getProblemById: publicProcedure
        .input(z.object({ id: z.number().int() }))
        .query(async ({ input }) => {
            return API_getProblemById(input.id);
        }),

    /** Fetches markdown + sample I/O for a single problem. Used by the contest
     *  problem picker preview pane; runs server-side to avoid CORS. */
    getProblemPreview: publicProcedure
        .input(z.object({ id: z.number().int() }))
        .query(async ({ input }) => {
            const [apiResult, markdown] = await Promise.all([
                API_getProblemById(input.id),
                getProblemMarkdown(input.id),
            ]);
            if (!apiResult.success || !apiResult.problem) return null;
            const [sampleInput, sampleOutput] = await Promise.all([
                fetchUrlContent(apiResult.problem.student_data_url),
                fetchUrlContent(apiResult.problem.student_output_url),
            ]);
            return {
                markdown: markdown ?? "",
                sampleInput: sampleInput || null,
                sampleOutput: sampleOutput || null,
            };
        }),
});
