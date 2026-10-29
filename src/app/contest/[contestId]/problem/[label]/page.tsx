import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { contestProblem } from "~/server/db/schema/contest";
import {
    canSeeProblems,
    contestManagerFor,
    findAccessibleContest,
} from "~/server/contests";
import { requireSession } from "~/server/current-membership";
import { getAppProblem } from "~/lib/api/lunaghs";
import ContestEditor from "./contest-editor";

export default async function ContestProblemPage({
    params,
}: {
    params: Promise<{ contestId: string; label: string }>;
}) {
    const { contestId: contestIdStr, label } = await params;
    const contestId = parseInt(contestIdStr, 10);

    if (isNaN(contestId)) {
        notFound();
    }

    // ── Auth ────────────────────────────────────────────────────────────────
    const { session, membership } = await requireSession(
        `/contest/${contestIdStr}/problem/${label}`,
    );

    // ── Fetch contest (if visible to, or managed by, this user) + problem ──
    const manager = contestManagerFor(session.user, membership);
    const [contestRow, contestProblemRows] = await Promise.all([
        findAccessibleContest(contestId, session.user.id, manager),
        db
            .select()
            .from(contestProblem)
            .where(
                and(
                    eq(contestProblem.contestId, contestId),
                    eq(contestProblem.label, label),
                ),
            )
            .limit(1),
    ]);

    const cp = contestProblemRows[0];

    if (!contestRow || !cp) {
        notFound();
    }

    // Problems stay hidden until the contest starts, except from those who
    // manage the contest (and set them up).
    if (!canSeeProblems(contestRow, manager)) {
        redirect(`/contest/${contestIdStr}`);
    }

    // ── Fetch full problem from external API ─────────────────────────────────
    const problem = await getAppProblem(cp.apiProblemId);

    if (!problem) {
        notFound();
    }

    return (
        <div className="flex h-screen flex-col pt-[10vh]">
            <ContestEditor
                problem={problem}
                contestProblem={{
                    id: cp.id,
                    contestId: cp.contestId,
                    apiProblemId: cp.apiProblemId,
                    label: cp.label,
                    maxPoints: cp.maxPoints,
                }}
                contestStatus={contestRow.status}
                // Measured here, so the countdown doesn't depend on the
                // viewer's clock.
                msUntilEnd={contestRow.endsAt.getTime() - Date.now()}
            />
        </div>
    );
}
