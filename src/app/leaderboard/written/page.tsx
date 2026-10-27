import { and, desc, eq, isNotNull, type SQL } from "drizzle-orm";
import { db } from "~/server/db";
import { user } from "~/server/db/schema/auth";
import { writtenTests } from "~/server/db/schema/written";
import {
    WRITTEN_COMPETITIONS,
    type WrittenCompetition,
} from "~/lib/written/competitions";
import { totalWrittenScores } from "~/lib/written/leaderboard";
import { currentSeasonYear } from "~/lib/written/season";
import {
    getCurrentMembership,
    leaderboardView,
} from "~/server/current-membership";
import {
    leaderboardVisibility,
    schoolNamesByUser,
} from "~/server/organizations";
import { LeaderboardKindTabs } from "../kind-tabs";
import { LeaderboardScopeTabs } from "../scope-tabs";
import WrittenLeaderboard from "./written-leaderboard";
import { WrittenFilterControls } from "./written-filters";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * The season (?year=2027, or ?year=all for every season; the current one
 * by default) and competition (?competition=district; all by default).
 */
function parseWrittenFilter(params: SearchParams): {
    year: number | undefined;
    competition: WrittenCompetition | undefined;
} {
    const { year, competition } = params;
    const n = typeof year === "string" ? Number(year) : NaN;
    return {
        year:
            year === "all"
                ? undefined
                : Number.isInteger(n)
                  ? n
                  : currentSeasonYear(),
        competition: WRITTEN_COMPETITIONS.find((c) => c === competition),
    };
}

/**
 * Written test scores ranked, for the viewer's school or all schools. The
 * same visibility rules as the programming leaderboard apply: students who
 * hid their scores never appear, and only those who opted in appear on the
 * shared one.
 */
export default async function WrittenLeaderboardPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;
    const { membership } = await getCurrentMembership();
    const { scope, filter } = leaderboardView(params, membership);
    const { year, competition } = parseWrittenFilter(params);

    const visible = leaderboardVisibility(
        scope,
        membership?.organizationId ?? null,
        filter,
    );
    const inYear: SQL | undefined =
        year === undefined ? undefined : eq(writtenTests.seasonYear, year);

    const [rows, yearRows, competitionRows] = await Promise.all([
        db
            .select({
                userId: user.id,
                name: user.name,
                score: writtenTests.score,
                accuracy: writtenTests.accuracy,
            })
            .from(writtenTests)
            .innerJoin(user, eq(writtenTests.userId, user.id))
            .where(
                and(
                    visible,
                    inYear,
                    competition
                        ? eq(writtenTests.competition, competition)
                        : undefined,
                ),
            ),
        db
            .selectDistinct({ year: writtenTests.seasonYear })
            .from(writtenTests)
            .innerJoin(user, eq(writtenTests.userId, user.id))
            .where(visible)
            .orderBy(desc(writtenTests.seasonYear)),
        db
            .selectDistinct({ competition: writtenTests.competition })
            .from(writtenTests)
            .innerJoin(user, eq(writtenTests.userId, user.id))
            .where(and(visible, inYear, isNotNull(writtenTests.competition))),
    ]);

    // Total each student's scores over the selected tests.
    const totals = totalWrittenScores(rows);

    // On the shared leaderboard, say which school each student is from.
    const schoolNames =
        scope === "global"
            ? await schoolNamesByUser(totals.map((t) => t.id))
            : null;

    const scores = totals.map((total) => ({
        ...total,
        schools: schoolNames?.get(total.id) ?? [],
    }));

    return (
        <main className="bg-primary flex min-h-screen flex-col items-center justify-center px-4 pt-24 pb-12 sm:px-6 lg:px-8">
            <LeaderboardKindTabs path="/leaderboard/written" />
            <LeaderboardScopeTabs
                path="/leaderboard/written"
                scope={scope}
                filter={filter}
                hasSchool={membership !== null}
            />
            <WrittenFilterControls
                year={year}
                competition={competition}
                years={yearRows.map((r) => r.year)}
                competitions={competitionRows
                    .map((r) => r.competition)
                    .filter((c) => c !== null)
                    .sort()}
            />
            <WrittenLeaderboard
                scores={scores}
                showSchools={scope === "global"}
            />
        </main>
    );
}
