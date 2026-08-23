import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { auth } from "auth";
import { db } from "~/server/db";
import { contest, contestProblem } from "~/server/db/schema/contest";
import { getProblemById, getAllCompetitions, toAppProblem } from "~/lib/api/lunaghs";
import { signInUrl } from "~/lib/auth/redirect-utils";
import type { Problem } from "~/server/db/schema/types";
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
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        redirect(signInUrl(`/contest/${contestIdStr}/problem/${label}`));
    }

    // ── Fetch contest + contest problem from DB ──────────────────────────────
    const [contestRows, contestProblemRows] = await Promise.all([
        db
            .select()
            .from(contest)
            .where(eq(contest.id, contestId))
            .limit(1),
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

    const contestRow = contestRows[0];
    const cp = contestProblemRows[0];

    if (!contestRow || !cp) {
        notFound();
    }

    // ── Fetch full problem from external API ─────────────────────────────────
    const [apiResult, competitions] = await Promise.all([
        getProblemById(cp.apiProblemId),
        getAllCompetitions(),
    ]);

    if (!apiResult.success || !apiResult.problem) {
        notFound();
    }

    const apiProblem = apiResult.problem;
    const competition = competitions.find((c) => c.id === apiProblem.competition);

    if (!competition) {
        notFound();
    }

    const problem = (await toAppProblem(apiProblem, competition)) as Problem;

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
                userId={session.user.id}
            />
        </div>
    );
}
