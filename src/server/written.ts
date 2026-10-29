import { and, desc, eq, isNotNull, type SQL } from "drizzle-orm";
import { db } from "~/server/db";
import { user } from "~/server/db/schema/auth";
import { writtenTests } from "~/server/db/schema/written";
import {
    inSeasonOrder,
    type WrittenCompetition,
} from "~/lib/written/competitions";

// Queries over written test scores, shared by the public leaderboard and
// teachers' views. Each takes the condition picking whose scores count
// (it may refer to `user`, which is joined in).

/** Season years with scores matching `where`, newest first. */
export async function writtenYears(where: SQL | undefined): Promise<number[]> {
    const rows = await db
        .selectDistinct({ year: writtenTests.seasonYear })
        .from(writtenTests)
        .innerJoin(user, eq(writtenTests.userId, user.id))
        .where(where)
        .orderBy(desc(writtenTests.seasonYear));
    return rows.map((r) => r.year);
}

/** Competitions with scores matching `where`, in season order. */
export async function writtenCompetitions(
    where: SQL | undefined,
): Promise<WrittenCompetition[]> {
    const rows = await db
        .selectDistinct({ competition: writtenTests.competition })
        .from(writtenTests)
        .innerJoin(user, eq(writtenTests.userId, user.id))
        .where(and(where, isNotNull(writtenTests.competition)));
    return inSeasonOrder(
        rows.map((r) => r.competition).filter((c) => c !== null),
    );
}

/** The competition of the most recently taken test matching `where`. */
export async function mostRecentWrittenCompetition(
    where: SQL | undefined,
): Promise<WrittenCompetition | null> {
    const [mostRecent] = await db
        .select({ competition: writtenTests.competition })
        .from(writtenTests)
        .innerJoin(user, eq(writtenTests.userId, user.id))
        .where(and(where, isNotNull(writtenTests.competition)))
        .orderBy(desc(writtenTests.takenAt))
        .limit(1);
    return mostRecent?.competition ?? null;
}
