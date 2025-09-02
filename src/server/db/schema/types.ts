import { problems } from "./problem";
import { type InferSelectModel } from "drizzle-orm";
export type Problem = InferSelectModel<typeof problems>;
