import { redirect } from "next/navigation";
import { getAppProblem } from "~/lib/api/lunaghs";
import PageCore from "./page-core";

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

    const problem = await getAppProblem(id);

    if (!problem) {
        redirect("/resources/past-problem/");
    }

    return (
        <main>
            <PageCore problem={problem} />
        </main>
    );
}
