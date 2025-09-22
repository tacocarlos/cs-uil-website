"use client";

import { api } from "~/trpc/react";

export default function SubmittedProblems({ userId }: { userId: string }) {
    const { isPending: isIncompleteProblemsPending, data: incompleteProblems } =
        api.submission.getAcceptedSubmissions.useQuery({ userId });

    if (incompleteProblems !== undefined) {
        console.dir(incompleteProblems);
    }
    return null;
}
