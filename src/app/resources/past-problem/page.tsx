import ProblemList from "~/components/resources/problem/problem-list";
import ProblemFAQ from "./[problemId]/problem-notes";
import { getAllAppProblems } from "~/lib/api/lunaghs";
import Footer from "~/components/global/Footer";

export default async function Page() {
    const pastProblems = await getAllAppProblems();

    return (
        <>
            <section className="px-4 py-16">
                <ProblemFAQ />
                <ProblemList
                    problems={pastProblems}
                    className="bg-card text-card-foreground rounded-2xl border p-10 shadow-sm"
                />
            </section>
            <Footer />
        </>
    );
}
