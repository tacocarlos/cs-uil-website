"use client";

import { use, useEffect, useRef, useState } from "react";
// useRef kept for the settings-initialisation guard below
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { api } from "~/trpc/react";
import type { ApiMinimalProblem } from "~/lib/api/lunaghs";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProblemRow {
    id: number; // contestProblemId
    apiProblemId: number;
    label: string;
    maxPoints: number;
    displayOrder: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const autoLabel = (idx: number) => LABELS[idx] ?? String(idx + 1);

// Format a Date (or ISO string) as the value needed by datetime-local inputs
function toDatetimeLocal(date: Date | string): string {
    return format(new Date(date), "yyyy-MM-dd'T'HH:mm");
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EditContestPage({
    params,
}: {
    params: Promise<{ contestId: string }>;
}) {
    const { contestId: contestIdStr } = use(params);
    const contestId = parseInt(contestIdStr, 10);
    const router = useRouter();

    // ── Query ─────────────────────────────────────────────────────────────────
    const utils = api.useUtils();
    const { data, isLoading, isError } = api.contest.getById.useQuery(
        { contestId },
        { enabled: !isNaN(contestId) },
    );

    // ── Settings form state ───────────────────────────────────────────────────
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [startsAt, setStartsAt] = useState("");
    const [endsAt, setEndsAt] = useState("");
    const [scoringMode, setScoringMode] = useState<"simple" | "penalty">(
        "simple",
    );
    const [penaltyPoints, setPenaltyPoints] = useState(20);
    const [savingSettings, setSavingSettings] = useState(false);

    // ── Problems state ────────────────────────────────────────────────────────
    // Local copy mirrors the server; mutations update it directly so no refetch needed
    const [problems, setProblems] = useState<ProblemRow[]>([]);
    const [savingProblemId, setSavingProblemId] = useState<number | null>(null);
    const [removingProblemId, setRemovingProblemId] = useState<number | null>(
        null,
    );

    // ── Add Problem section ───────────────────────────────────────────────────
    // Use tRPC so the fetch runs server-side (direct calls hit CORS from the browser)
    const { data: allProblems = [], isLoading: loadingApiProblems } =
        api.problem.getMinimalProblems.useQuery();
    const [addSearch, setAddSearch] = useState("");
    const [addingProblem, setAddingProblem] = useState(false);

    // Mutations
    const updateContest = api.contest.update.useMutation();
    const updateProblem = api.contest.updateProblem.useMutation();
    const removeProblem = api.contest.removeProblem.useMutation();
    const addProblem = api.contest.addProblem.useMutation();
    const deleteContest = api.contest.delete.useMutation();

    // ── Initialise local state from query data (once) ─────────────────────────
    const initialised = useRef(false);
    useEffect(() => {
        if (!data || initialised.current) return;
        initialised.current = true;

        setName(data.name);
        setDescription(data.description);
        setStartsAt(toDatetimeLocal(data.startsAt));
        setEndsAt(toDatetimeLocal(data.endsAt));
        setScoringMode(data.scoringMode as "simple" | "penalty");
        setPenaltyPoints(data.penaltyPoints);
        setProblems(
            data.problems.map((p) => ({
                id: p.id,
                apiProblemId: p.apiProblemId,
                label: p.label,
                maxPoints: p.maxPoints,
                displayOrder: p.displayOrder,
            })),
        );
    }, [data]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleSaveSettings = async () => {
        if (!name.trim()) {
            toast.error("Contest name is required");
            return;
        }
        if (!startsAt || !endsAt) {
            toast.error("Start and end times are required");
            return;
        }
        setSavingSettings(true);
        try {
            await updateContest.mutateAsync({
                contestId,
                name: name.trim(),
                description,
                startsAt: new Date(startsAt).toISOString(),
                endsAt: new Date(endsAt).toISOString(),
                scoringMode,
                penaltyPoints:
                    scoringMode === "penalty" ? penaltyPoints : undefined,
            });
            toast.success("Settings saved");
            await utils.contest.getById.invalidate({ contestId });
        } catch (err) {
            toast.error("Failed to save: " + (err as Error).message);
        } finally {
            setSavingSettings(false);
        }
    };

    const handleSaveProblem = async (row: ProblemRow) => {
        setSavingProblemId(row.id);
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
            setSavingProblemId(null);
        }
    };

    const handleRemoveProblem = async (row: ProblemRow) => {
        setRemovingProblemId(row.id);
        try {
            await removeProblem.mutateAsync({ contestProblemId: row.id });
            setProblems((prev) => prev.filter((p) => p.id !== row.id));
            toast.success(`Problem ${row.label} removed`);
        } catch (err) {
            toast.error("Failed to remove problem: " + (err as Error).message);
        } finally {
            setRemovingProblemId(null);
        }
    };

    const handleAddProblem = async (apiProblem: ApiMinimalProblem) => {
        const nextOrder = problems.length;
        const label = autoLabel(nextOrder);
        setAddingProblem(true);
        try {
            const added = await addProblem.mutateAsync({
                contestId,
                apiProblemId: apiProblem.id,
                label,
                maxPoints: 60,
                displayOrder: nextOrder,
            });
            setProblems((prev) => [
                ...prev,
                {
                    id: added.id,
                    apiProblemId: added.apiProblemId,
                    label: added.label,
                    maxPoints: added.maxPoints,
                    displayOrder: added.displayOrder,
                },
            ]);
            setAddSearch("");
            toast.success(`Added: ${apiProblem.name}`);
        } catch (err) {
            toast.error("Failed to add problem: " + (err as Error).message);
        } finally {
            setAddingProblem(false);
        }
    };

    const updateLocalProblem = (id: number, patch: Partial<ProblemRow>) => {
        setProblems((prev) =>
            prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        );
    };

    // IDs already in the contest (to exclude from Add Problem list)
    const existingApiProblemIds = new Set(problems.map((p) => p.apiProblemId));

    const filteredApiProblems = allProblems.filter(
        (p) =>
            !existingApiProblemIds.has(p.id) &&
            p.name.toLowerCase().includes(addSearch.toLowerCase()),
    );

    // ── Loading / error states ─────────────────────────────────────────────────

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
                    onClick={() => router.push("/dashboard/teacher/contests")}
                >
                    Back to contests
                </Button>
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gray-50 px-8 pt-20 pb-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Edit Contest</h1>
                    <p className="mt-0.5 text-sm text-gray-500">{data.name}</p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard/teacher/contests")}
                >
                    ← Back
                </Button>
            </div>

            <div className="max-w-3xl space-y-6">
                {/* ── Settings ──────────────────────────────────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle>Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-description">
                                Description
                            </Label>
                            <Textarea
                                id="edit-description"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-startsAt">Start</Label>
                                <Input
                                    id="edit-startsAt"
                                    type="datetime-local"
                                    value={startsAt}
                                    onChange={(e) =>
                                        setStartsAt(e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-endsAt">End</Label>
                                <Input
                                    id="edit-endsAt"
                                    type="datetime-local"
                                    value={endsAt}
                                    onChange={(e) => setEndsAt(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-scoringMode">
                                Scoring Mode
                            </Label>
                            <Select
                                value={scoringMode}
                                onValueChange={(v) =>
                                    setScoringMode(v as "simple" | "penalty")
                                }
                            >
                                <SelectTrigger id="edit-scoringMode">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="simple">
                                        Simple
                                    </SelectItem>
                                    <SelectItem value="penalty">
                                        ICPC Penalty
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {scoringMode === "penalty" && (
                            <div className="space-y-2">
                                <Label htmlFor="edit-penaltyPoints">
                                    Penalty Points per Wrong Attempt
                                </Label>
                                <Input
                                    id="edit-penaltyPoints"
                                    type="number"
                                    min={0}
                                    value={penaltyPoints}
                                    onChange={(e) =>
                                        setPenaltyPoints(
                                            parseInt(e.target.value) || 0,
                                        )
                                    }
                                    className="w-32"
                                />
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={handleSaveSettings}
                                disabled={savingSettings}
                            >
                                {savingSettings ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving…
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Settings
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Problems ──────────────────────────────────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle>Problems</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Current problems list */}
                        {problems.length === 0 ? (
                            <p className="py-4 text-center text-sm text-gray-500">
                                No problems added yet.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {problems.map((row) => {
                                    const isSaving = savingProblemId === row.id;
                                    const isRemoving =
                                        removingProblemId === row.id;
                                    return (
                                        <div
                                            key={row.id}
                                            className="flex items-center gap-2 rounded-md border bg-white p-2"
                                        >
                                            <span className="min-w-0 flex-1 truncate text-sm text-gray-600">
                                                #{row.apiProblemId}
                                            </span>
                                            <div className="flex shrink-0 items-center gap-1">
                                                <Label className="text-xs text-gray-500">
                                                    Label
                                                </Label>
                                                <Input
                                                    className="h-7 w-14 px-1 text-center text-xs"
                                                    value={row.label}
                                                    onChange={(e) =>
                                                        updateLocalProblem(
                                                            row.id,
                                                            {
                                                                label: e.target
                                                                    .value,
                                                            },
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="flex shrink-0 items-center gap-1">
                                                <Label className="text-xs text-gray-500">
                                                    Pts
                                                </Label>
                                                <Input
                                                    className="h-7 w-16 px-1 text-center text-xs"
                                                    type="number"
                                                    min={0}
                                                    value={row.maxPoints}
                                                    onChange={(e) =>
                                                        updateLocalProblem(
                                                            row.id,
                                                            {
                                                                maxPoints:
                                                                    parseInt(
                                                                        e.target
                                                                            .value,
                                                                    ) || 0,
                                                            },
                                                        )
                                                    }
                                                />
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-7 w-7 shrink-0"
                                                disabled={
                                                    isSaving || isRemoving
                                                }
                                                onClick={() =>
                                                    handleSaveProblem(row)
                                                }
                                            >
                                                {isSaving ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Save className="h-3.5 w-3.5" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 shrink-0 text-red-500 hover:text-red-700"
                                                disabled={
                                                    isSaving || isRemoving
                                                }
                                                onClick={() =>
                                                    handleRemoveProblem(row)
                                                }
                                            >
                                                {isRemoving ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                )}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* ── Add Problem ─────────────────────────────── */}
                        <div className="border-t pt-4">
                            <p className="mb-2 text-sm font-medium">
                                Add Problem
                            </p>
                            <div className="space-y-2">
                                <Input
                                    placeholder="Search problems by name…"
                                    value={addSearch}
                                    onChange={(e) =>
                                        setAddSearch(e.target.value)
                                    }
                                />

                                {loadingApiProblems ? (
                                    <div className="flex items-center justify-center rounded-md border py-6 text-sm text-gray-500">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Loading problems…
                                    </div>
                                ) : (
                                    <div className="h-48 overflow-y-auto rounded-md border">
                                        {filteredApiProblems.length === 0 ? (
                                            <p className="py-6 text-center text-sm text-gray-500">
                                                {allProblems.length === 0
                                                    ? "No problems available"
                                                    : "No matching problems"}
                                            </p>
                                        ) : (
                                            <ul className="divide-y">
                                                {filteredApiProblems.map(
                                                    (p) => (
                                                        <li
                                                            key={p.id}
                                                            className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-gray-50"
                                                            onClick={() => {
                                                                if (
                                                                    !addingProblem
                                                                )
                                                                    void handleAddProblem(
                                                                        p,
                                                                    );
                                                            }}
                                                        >
                                                            <span>
                                                                <span className="mr-2 text-xs text-gray-400">
                                                                    #{p.id}
                                                                </span>
                                                                {p.name}
                                                            </span>
                                                            {addingProblem ? (
                                                                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                                            ) : (
                                                                <Plus className="h-4 w-4 shrink-0 text-green-600" />
                                                            )}
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Delete button ──────────────────────────────────────── */}
                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        disabled={deleteContest.isPending}
                        onClick={() => {
                            if (
                                confirm(
                                    "Delete this contest? This cannot be undone.",
                                )
                            ) {
                                deleteContest.mutate(
                                    { contestId },
                                    {
                                        onSuccess: () =>
                                            router.push(
                                                "/dashboard/teacher/contests",
                                            ),
                                        onError: (err) =>
                                            toast.error(
                                                "Failed to delete: " +
                                                    err.message,
                                            ),
                                    },
                                );
                            }
                        }}
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
