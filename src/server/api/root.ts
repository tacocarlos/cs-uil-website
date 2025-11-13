import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { executeRouter } from "./routers/execute";
import { submissionRouter } from "./routers/submission";
import { userRouter } from "./routers/user";
import { problemRouter } from "./routers/problem";
import { writtenRouter } from "./routers/written";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
    execute: executeRouter,
    submission: submissionRouter,
    user: userRouter,
    problem: problemRouter,
    written: writtenRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
