"use client";

import { api } from "~/trpc/react";

export default function SubmittedProblems() {
    const { isPending: isIncompleteProblemsPending, data: incompleteProblems } =
        api.submission.getAcceptedSubmissions.useQuery();

    if (incompleteProblems !== undefined) {
        console.dir(incompleteProblems);
    }
    return null;
}
