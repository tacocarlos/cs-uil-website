"use client";

import { Accordion } from "~/components/ui/accordion";
import { ProblemAccordionItem } from "./problem-accordion-item";
import { type Problem } from "~/server/db/schema/types";
import { api } from "~/trpc/react";
import { useSession } from "auth-client";
import { submission, type Submission } from "~/server/db/schema/submission";

export default function ProblemList({
    problems,
    className,
}: {
    problems: Problem[];
    className?: string;
}) {
    const { data: session } = useSession();
    const user = session?.user;
    const submissions = problems.map((p) =>
        api.submission.getMostRecentSubmission.useQuery({
            userId: user?.id ?? "",
            problemId: p.id,
        }),
    );

    const pairs: [Problem, Submission | undefined][] = [];
    for (let i = 0; i < problems.length && i < submissions.length; i++) {
        pairs.push([
            problems[i]!,
            submissions[i]?.data as Submission | undefined,
        ]);
    }

    return (
        <Accordion
            type="multiple"
            className={`mx-auto max-w-3xl ${className ?? ""}`}
        >
            {pairs.map(([problem, s]) => (
                <ProblemAccordionItem
                    key={problem.id}
                    problem={problem}
                    mostRecentSubmission={s}
                />
            ))}
        </Accordion>
    );
}
