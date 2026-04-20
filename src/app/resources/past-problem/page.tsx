import ProblemList from "~/components/resources/problem/problem-list";
import { type Problem } from "~/server/db/schema/types";
import ProblemFAQ from "./[problemId]/problem-notes";
import { getAllAppProblems } from "~/lib/api/lunaghs";

export default async function Page() {
    const pastProblems = await getAllAppProblems();

    return (
        <>
            <section className="bg-primary-50 px-4 py-16">
                <ProblemFAQ />
                <ProblemList
                    problems={pastProblems as Problem[]}
                    className="bg-secondary rounded-2xl border-2 p-10"
                />
            </section>
        </>
    );
}
