import { redirect } from "next/navigation";
import {
    getProblemById,
    getAllCompetitions,
    toAppProblem,
} from "~/lib/api/lunaghs";
import PageCore from "./page-core";
import type { Problem } from "~/server/db/schema/types";

export default async function Page({
    params,
}: {
    params: Promise<{ problemId: string }>;
}) {
    const { problemId } = await params;
    const id = parseInt(problemId, 10);

    if (isNaN(id)) {
        redirect("/resources/past-problem/");
    }

    const [apiProblem, competitions] = await Promise.all([
        getProblemById(id),
        getAllCompetitions(),
    ]);

    if (!apiProblem) {
        redirect("/resources/past-problem/");
    }
    const competition = competitions.find(
        (c) => c.id === apiProblem.competition,
    );

    if (!competition) {
        redirect("/resources/past-problem/");
    }

    const problem = (await toAppProblem(apiProblem, competition)) as Problem;

    return (
        <main>
            <PageCore problem={problem} />
        </main>
    );
}
