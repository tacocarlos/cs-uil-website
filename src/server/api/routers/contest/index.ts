import { createTRPCRouter } from "../../trpc";
import { contestAdmin } from "./admin";
import { contestParticipation } from "./participation";
import { contestQueries } from "./queries";

// Procedures are grouped by audience in separate files but merged flat, so
// client paths stay `api.contest.<name>`.
export const contestRouter = createTRPCRouter({
    ...contestQueries,
    ...contestParticipation,
    ...contestAdmin,
});
