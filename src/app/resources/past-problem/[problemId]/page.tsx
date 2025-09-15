import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "~/server/db";
import { problems } from "~/server/db/schema/problem";
import PageCore from "./page-core";
import type { Problem } from "~/server/db/schema/types";

export default async function Page({
    params,
}: {
    params: Promise<{ problemId: string }>;
}) {
    const { problemId } = await params;
    const problemQueryResult = await db
        .select()
        .from(problems)
        .where(eq(problems.id, parseInt(problemId)))
        .limit(1);
    if (problemQueryResult.length == 0) {
        redirect("/resources/past-problem/");
    }

    return (
        <main>
            <PageCore problem={problemQueryResult[0] as Problem} />
        </main>
    );
}
