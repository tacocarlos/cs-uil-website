import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { api, type RouterOutputs } from "~/trpc/react";
import type { ApiMinimalProblem } from "~/lib/api/lunaghs";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
    autoLabel,
    DEFAULT_MAX_POINTS,
} from "../../_components/contest-settings";
import { ContestProblemRow } from "../../_components/contest-problem-row";
import { ProblemSearchList } from "../../_components/problem-search-list";

type ContestProblem = NonNullable<
    RouterOutputs["contest"]["getById"]
>["problems"][number];

/**
 * The contest's problem list plus a picker to add more. Edits to a row's
 * label/points are local until that row's save button is pressed.
 */
export function ProblemsCard({
    contestId,
    initialProblems,
}: {
    contestId: number;
    initialProblems: ContestProblem[];
}) {
    // Local copy mirrors the server; mutations update it directly so no
    // refetch is needed.
    const [problems, setProblems] = useState(initialProblems);
    const [savingId, setSavingId] = useState<number | null>(null);
    const [removingId, setRemovingId] = useState<number | null>(null);

    // Use tRPC so the fetch runs server-side (direct calls hit CORS from the browser)
    const { data: allProblems = [], isLoading: loadingProblems } =
        api.problem.getMinimalProblems.useQuery();
    const [search, setSearch] = useState("");

    const updateProblem = api.contest.updateProblem.useMutation();
    const removeProblem = api.contest.removeProblem.useMutation();
    const addProblem = api.contest.addProblem.useMutation();

    const updateLocal = (id: number, patch: Partial<ContestProblem>) => {
        setProblems((prev) =>
            prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        );
    };

    const handleSave = async (row: ContestProblem) => {
        setSavingId(row.id);
        try {
            await updateProblem.mutateAsync({
                contestProblemId: row.id,
                label: row.label,
                maxPoints: row.maxPoints,
            });
            toast.success(`Problem ${row.label} saved`);
        } catch (err) {
            toast.error("Failed to save problem: " + (err as Error).message);
        } finally {
            setSavingId(null);
        }
    };

    const handleRemove = async (row: ContestProblem) => {
        setRemovingId(row.id);
        try {
            await removeProblem.mutateAsync({ contestProblemId: row.id });
            setProblems((prev) => prev.filter((p) => p.id !== row.id));
            toast.success(`Problem ${row.label} removed`);
        } catch (err) {
            toast.error("Failed to remove problem: " + (err as Error).message);
        } finally {
            setRemovingId(null);
        }
    };

    const handleAdd = async (apiProblem: ApiMinimalProblem) => {
        if (addProblem.isPending) return;
        try {
            const added = await addProblem.mutateAsync({
                contestId,
                apiProblemId: apiProblem.id,
                label: autoLabel(problems.length),
                maxPoints: DEFAULT_MAX_POINTS,
                displayOrder: problems.length,
            });
            setProblems((prev) => [...prev, added]);
            setSearch("");
            toast.success(`Added: ${apiProblem.name}`);
        } catch (err) {
            toast.error("Failed to add problem: " + (err as Error).message);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Problems</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {problems.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-500">
                        No problems added yet.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {problems.map((row) => {
                            const busy =
                                savingId === row.id || removingId === row.id;
                            return (
                                <ContestProblemRow
                                    key={row.id}
                                    title={
                                        <span className="text-gray-600">
                                            #{row.apiProblemId}
                                        </span>
                                    }
                                    label={row.label}
                                    maxPoints={row.maxPoints}
                                    onChange={(patch) =>
                                        updateLocal(row.id, patch)
                                    }
                                    actions={
                                        <>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-7 w-7 shrink-0"
                                                disabled={busy}
                                                onClick={() => handleSave(row)}
                                            >
                                                {savingId === row.id ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Save className="h-3.5 w-3.5" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 shrink-0 text-red-500 hover:text-red-700"
                                                disabled={busy}
                                                onClick={() =>
                                                    handleRemove(row)
                                                }
                                            >
                                                {removingId === row.id ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                )}
                                            </Button>
                                        </>
                                    }
                                />
                            );
                        })}
                    </div>
                )}

                <div className="border-t pt-4">
                    <p className="mb-2 text-sm font-medium">Add Problem</p>
                    <ProblemSearchList
                        problems={allProblems}
                        isLoading={loadingProblems}
                        excludeIds={
                            new Set(problems.map((p) => p.apiProblemId))
                        }
                        search={search}
                        onSearchChange={setSearch}
                        onSelect={(p) => void handleAdd(p)}
                        listClassName="h-48"
                        renderAction={() =>
                            addProblem.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            ) : (
                                <Plus className="h-4 w-4 shrink-0 text-green-600" />
                            )
                        }
                    />
                </div>
            </CardContent>
        </Card>
    );
}
