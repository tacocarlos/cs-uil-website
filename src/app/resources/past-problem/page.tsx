import { eq } from "drizzle-orm";
import ProblemList from "~/components/resources/problem/problem-list";
import { db } from "~/server/db";
import { problems } from "~/server/db/schema/problem";
import { type Problem } from "~/server/db/schema/types";

export default async function Page() {
    const pastProblems = await db.select().from(problems);
    // .where(eq(problems.enabled, true));
    console.dir("got data");
    console.dir(pastProblems);
    return (
        <>
            <section className="bg-primary-50 px-4 py-16">
                <ProblemList
                    problems={pastProblems as Problem[]}
                    className="bg-secondary rounded-2xl border-2 p-10"
                />
            </section>
        </>
    );
}
