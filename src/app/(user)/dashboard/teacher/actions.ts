"use server";

import { revalidateTag } from "next/cache";
import { LUNAGHS_CACHE_TAG } from "~/lib/api/lunaghs";

/**
 * Invalidates every Next.js cached fetch that was made against the Lunaghs
 * problem API. The next request for any problem data will bypass the cache
 * and fetch fresh content from https://api.lunaghs.dev.
 */
export async function invalidateProblemCache() {
    revalidateTag(LUNAGHS_CACHE_TAG);
}
