import Link from "next/link";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { tabClass } from "../tab-class";
import { LeaderboardKindTabs } from "../kind-tabs";
import { requireSession } from "~/server/current-membership";
import { isSchoolTeacher } from "~/server/organizations";
import {
    latestPracticeTest,
    practiceLeaderboard,
    practiceTests,
    isConnected,
    memberCourse,
} from "~/server/prairielearn/leaderboard";
import { isStale, syncSchoolOnce } from "~/server/prairielearn/sync";
import {
    formatPracticeDate,
    formatPracticeTime,
    uilMaxScore,
} from "~/lib/prairielearn/practice-tests";
import PracticeLeaderboard from "./practice-leaderboard";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * The viewer's school ranked by best score on each PrairieLearn practice
 * test (?test=<assessment ID>; the one taken most recently by default).
 * Only for members of a school linked to a PrairieLearn course. Results
 * are copied from PrairieLearn, refreshed when they're a few minutes old.
 */
export default async function PracticeLeaderboardPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const { session, membership } = await requireSession(
        "/leaderboard/practice",
    );
    // Former students, other schools, and schools whose teachers haven't
    // connected a course yet are sent back.
    let course = await memberCourse(
        session.user.id,
        membership?.organizationId,
    );
    if (!membership || !isConnected(course)) redirect("/leaderboard");
    const { organizationId } = membership;

    if (course.syncedAt === null) {
        // Nothing copied yet: wait for the first copy (errors show below).
        await syncSchoolOnce(organizationId).catch(() => undefined);
        const refreshed = await memberCourse(session.user.id, organizationId);
        if (isConnected(refreshed)) course = refreshed;
    } else if (isStale(course.syncedAt)) {
        // Show what's there now and refresh for the next view.
        after(() => syncSchoolOnce(organizationId).catch(() => undefined));
    }

    const [tests, latest, { test }] = await Promise.all([
        practiceTests(organizationId),
        latestPracticeTest(organizationId),
        searchParams,
    ]);
    const selected =
        tests.find((t) => t.assessmentId === test) ??
        tests.find((t) => t.assessmentId === latest) ??
        tests[0];

    const teacher = isSchoolTeacher(membership);
    const scores = selected
        ? await practiceLeaderboard(organizationId, selected.assessmentId, {
              includeHidden: teacher,
          })
        : [];

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 pt-24 pb-12 sm:px-6 lg:px-8">
            <LeaderboardKindTabs path="/leaderboard/practice" showPractice />
            {tests.length > 0 && (
                <nav className="bg-muted mb-4 flex flex-wrap justify-center rounded-lg p-1">
                    {tests.map((t) => (
                        <Link
                            key={t.assessmentId}
                            href={`/leaderboard/practice?test=${encodeURIComponent(t.assessmentId)}`}
                            className={tabClass(
                                t.assessmentId === selected?.assessmentId,
                                "px-3 py-1",
                            )}
                        >
                            {t.level}
                        </Link>
                    ))}
                </nav>
            )}
            <PracticeLeaderboard
                level={selected?.level ?? null}
                scores={scores.map((s) => ({
                    userId: s.userId,
                    name: s.name,
                    rank: s.rank,
                    score: s.score,
                    maxScore: uilMaxScore(s.best),
                    correct: s.best.correct,
                    wrong: s.best.wrong,
                    skipped: s.best.skipped,
                    achievedOn: formatPracticeDate(s.best.startedAt),
                    attempts: s.attempts,
                    hidden: s.hidden,
                }))}
                updated={course.syncedAt && formatPracticeTime(course.syncedAt)}
                syncError={teacher ? course.syncError : null}
                manageHref={
                    teacher ? "/dashboard/teacher/practice-tests" : null
                }
            />
        </div>
    );
}
