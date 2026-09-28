"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import type { ApiMinimalProblem } from "~/lib/api/lunaghs";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Loader2, Plus, X } from "lucide-react";
import {
    autoLabel,
    DEFAULT_MAX_POINTS,
    EMPTY_CONTEST_SETTINGS,
    settingsToMutationInput,
    validateSettings,
    type ContestSettings,
} from "../_components/contest-settings";
import { ContestSettingsFields } from "../_components/contest-settings-fields";
import { ContestProblemRow } from "../_components/contest-problem-row";
import { ProblemSearchList } from "../_components/problem-search-list";
import { ProblemPreview } from "./problem-preview";

interface SelectedProblem {
    apiProblemId: number;
    name: string;
    label: string;
    maxPoints: number;
}

export default function NewContestPage() {
    const router = useRouter();

    const [settings, setSettings] = useState<ContestSettings>(
        EMPTY_CONTEST_SETTINGS,
    );

    const { data: allProblems = [], isLoading: loadingProblems } =
        api.problem.getMinimalProblems.useQuery();
    const [problemSearch, setProblemSearch] = useState("");
    const [selectedProblems, setSelectedProblems] = useState<SelectedProblem[]>(
        [],
    );
    const [previewProblem, setPreviewProblem] =
        useState<ApiMinimalProblem | null>(null);

    const [submitting, setSubmitting] = useState(false);

    const createContest = api.contest.create.useMutation();
    const addProblem = api.contest.addProblem.useMutation();

    const selectedIds = new Set(selectedProblems.map((p) => p.apiProblemId));

    const handleAddProblem = (p: ApiMinimalProblem) => {
        setSelectedProblems((prev) => [
            ...prev,
            {
                apiProblemId: p.id,
                name: p.name,
                label: autoLabel(prev.length),
                maxPoints: DEFAULT_MAX_POINTS,
            },
        ]);
    };

    const handleRemoveProblem = (idx: number) => {
        setSelectedProblems((prev) =>
            prev
                .filter((_, i) => i !== idx)
                // Re-assign auto-labels to preserve A, B, C order
                .map((p, i) => ({ ...p, label: autoLabel(i) })),
        );
    };

    const updateSelectedProblem = (
        idx: number,
        patch: Partial<SelectedProblem>,
    ) => {
        setSelectedProblems((prev) =>
            prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)),
        );
    };

    const handleSubmit = async () => {
        const error = validateSettings(settings);
        if (error) {
            toast.error(error);
            return;
        }
        setSubmitting(true);
        try {
            // The server records the signed-in teacher as the creator.
            const created = await createContest.mutateAsync(
                settingsToMutationInput(settings),
            );

            // Add problems sequentially to preserve display order
            for (const [i, p] of selectedProblems.entries()) {
                await addProblem.mutateAsync({
                    contestId: created.id,
                    apiProblemId: p.apiProblemId,
                    label: p.label,
                    maxPoints: p.maxPoints,
                    displayOrder: i,
                });
            }

            toast.success("Contest created!");
            router.push("/dashboard/teacher/contests");
        } catch (err) {
            toast.error("Failed to create contest: " + (err as Error).message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 px-8 pt-20 pb-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold">New Contest</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Fill in the details below, then pick problems.
                </p>
            </div>

            <div className="max-w-5xl space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Contest Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ContestSettingsFields
                            value={settings}
                            onChange={setSettings}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Problems</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <ProblemSearchList
                                label="Search problems"
                                problems={allProblems}
                                isLoading={loadingProblems}
                                excludeIds={selectedIds}
                                search={problemSearch}
                                onSearchChange={setProblemSearch}
                                onSelect={setPreviewProblem}
                                selectedId={previewProblem?.id}
                                listClassName="h-72"
                                renderAction={(p) => (
                                    <button
                                        type="button"
                                        title="Add to contest"
                                        className="ml-2 shrink-0 rounded p-0.5 text-green-600 hover:bg-green-50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddProblem(p);
                                        }}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                )}
                            />
                            <ProblemPreview
                                problem={previewProblem}
                                isAdded={
                                    !!previewProblem &&
                                    selectedIds.has(previewProblem.id)
                                }
                                onAdd={handleAddProblem}
                            />
                        </div>

                        {selectedProblems.length > 0 && (
                            <div className="space-y-2">
                                <Label>Selected Problems</Label>
                                <div className="space-y-2">
                                    {selectedProblems.map((p, idx) => (
                                        <ContestProblemRow
                                            key={p.apiProblemId}
                                            title={p.name}
                                            label={p.label}
                                            maxPoints={p.maxPoints}
                                            onChange={(patch) =>
                                                updateSelectedProblem(
                                                    idx,
                                                    patch,
                                                )
                                            }
                                            actions={
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 shrink-0 text-red-500 hover:text-red-700"
                                                    onClick={() =>
                                                        handleRemoveProblem(idx)
                                                    }
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            }
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button
                        variant="outline"
                        disabled={submitting}
                        onClick={() =>
                            router.push("/dashboard/teacher/contests")
                        }
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating…
                            </>
                        ) : (
                            "Create Contest"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
