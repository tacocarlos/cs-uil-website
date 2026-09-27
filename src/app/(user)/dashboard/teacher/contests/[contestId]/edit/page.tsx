"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { SettingsCard } from "./settings-card";
import { ProblemsCard } from "./problems-card";

const CONTESTS_PATH = "/dashboard/teacher/contests";

export default function EditContestPage({
    params,
}: {
    params: Promise<{ contestId: string }>;
}) {
    const { contestId: contestIdStr } = use(params);
    const contestId = parseInt(contestIdStr, 10);
    const router = useRouter();

    const { data, isLoading, isError } = api.contest.getById.useQuery(
        { contestId },
        { enabled: !isNaN(contestId) },
    );
    const deleteContest = api.contest.delete.useMutation();

    if (isNaN(contestId)) {
        return (
            <div className="min-h-screen bg-gray-50 px-8 pt-20 pb-8">
                <p className="text-sm text-red-500">Invalid contest ID.</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 pt-20">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="min-h-screen bg-gray-50 px-8 pt-20 pb-8">
                <p className="text-sm text-red-500">Contest not found.</p>
                <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push(CONTESTS_PATH)}
                >
                    Back to contests
                </Button>
            </div>
        );
    }

    const handleDelete = () => {
        if (!confirm("Delete this contest? This cannot be undone.")) return;
        deleteContest.mutate(
            { contestId },
            {
                onSuccess: () => router.push(CONTESTS_PATH),
                onError: (err) =>
                    toast.error("Failed to delete: " + err.message),
            },
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 px-8 pt-20 pb-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Edit Contest</h1>
                    <p className="mt-0.5 text-sm text-gray-500">{data.name}</p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => router.push(CONTESTS_PATH)}
                >
                    ← Back
                </Button>
            </div>

            <div className="max-w-3xl space-y-6">
                <SettingsCard contest={data} />
                <ProblemsCard
                    contestId={contestId}
                    initialProblems={data.problems}
                />

                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        disabled={deleteContest.isPending}
                        onClick={handleDelete}
                    >
                        {deleteContest.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete Contest
                    </Button>
                </div>
            </div>
        </div>
    );
}
