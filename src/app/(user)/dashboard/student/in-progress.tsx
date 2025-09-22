"use client";

import { api } from "~/trpc/react";

export default function InProgressProblems({ userId }: { userId: string }) {
    const { isPending: isIncompleteProblemsPending, data: incompleteProblems } =
        api.submission.getDeniedSubmissions.useQuery({ userId });

    if (incompleteProblems !== undefined) {
        console.dir(incompleteProblems);
    }
    return null;
}
