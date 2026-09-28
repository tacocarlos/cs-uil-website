"use client";

import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";

import { type Submission } from "~/server/db/schema/submission";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "~/components/ui/button";

const ProblemURL = (id: string | number) => `/resources/past-problem/${id}`;

function UnsolvedProblem({
    latestSubmission,
}: {
    latestSubmission: Submission;
}) {
    const { isPending, data } = api.problem.getProblemById.useQuery({
        id: latestSubmission.problemId,
    });
    if (isPending || data === undefined || data.success === false) {
        return <Skeleton className="h-16 w-full" />;
    }

    return (
        <Button variant="link" className="w-1/4 rounded border p-7" asChild>
            <Link href={ProblemURL(latestSubmission.problemId)}>
                {data.problem?.name}
                <br />
                Last Attempted:{" "}
                {format(
                    latestSubmission.timeSubmitted,
                    "EEEE MMM d, yyyy HH:mm",
                )}
            </Link>
        </Button>
    );
}

export default function InProgressProblems() {
    const { isPending: isIncompleteProblemsPending, data: incompleteProblems } =
        api.submission.getDeniedSubmissions.useQuery();

    if (incompleteProblems !== undefined) {
        console.dir(incompleteProblems);
    }

    if (isIncompleteProblemsPending || incompleteProblems === undefined) {
        return <Skeleton className="h-24 w-full" />;
    }

    const unsolvedProblems = incompleteProblems!.map((p, idx) => (
        <UnsolvedProblem key={idx} latestSubmission={p.submission} />
    ));

    return (
        <section className="space-y-3">
            <h2 className="mt-6 mb-4 text-lg font-semibold">
                Attempted Problems
            </h2>
            <div className="grid-cols-1 space-x-3 lg:grid-cols-4">
                {unsolvedProblems}
            </div>
        </section>
    );
}
