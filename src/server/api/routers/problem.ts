import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getAllAppProblems } from "~/lib/api/lunaghs";

export const problemRouter = createTRPCRouter({
    getProblems: publicProcedure.query(async () => {
        return getAllAppProblems();
    }),
});
