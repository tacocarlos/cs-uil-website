"use server";

import { revalidateTag } from "next/cache";
import { LUNAGHS_CACHE_TAG } from "~/lib/api/lunaghs";
import { isSiteAdmin } from "~/lib/auth/roles";
import { getCurrentMembership } from "~/server/current-membership";
import { isSchoolTeacher } from "~/server/organizations";

/**
 * Invalidates every Next.js cached fetch that was made against the Lunaghs
 * problem API. The next request for any problem data will bypass the cache
 * and fetch fresh content from https://api.lunaghs.dev.
 *
 * Server actions are public endpoints whatever page uses them, so this
 * checks for a teacher (or site admin) itself.
 */
export async function invalidateProblemCache() {
    const { session, membership } = await getCurrentMembership();
    if (
        !session ||
        (!isSchoolTeacher(membership) && !isSiteAdmin(session.user.role))
    ) {
        throw new Error("Only teachers can refresh the problem cache.");
    }
    revalidateTag(LUNAGHS_CACHE_TAG);
}
