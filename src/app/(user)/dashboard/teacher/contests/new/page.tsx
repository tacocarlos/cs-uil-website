"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "auth-client";
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
import { Loader2, Plus, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeMathjax from "rehype-mathjax";
// Auto-label sequence A, B, C…
const LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const autoLabel = (idx: number) => LABELS[idx] ?? String(idx + 1);

interface SelectedProblem {
    apiProblemId: number;
    name: string;
    label: string;
    maxPoints: number;
}

export default function NewContestPage() {
    const router = useRouter();
    const { data: session } = useSession();

    // ── Contest details ───────────────────────────────────────────────────────
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [startsAt, setStartsAt] = useState("");
    const [endsAt, setEndsAt] = useState("");
    const [scoringMode, setScoringMode] = useState<"simple" | "penalty">(
        "simple",
    );
    const [penaltyPoints, setPenaltyPoints] = useState(20);

    // ── Problem selection ─────────────────────────────────────────────────────
    const { data: allProblems = [], isLoading: loadingProblems } =
        api.problem.getMinimalProblems.useQuery();
    const [problemSearch, setProblemSearch] = useState("");
    const [selectedProblems, setSelectedProblems] = useState<SelectedProblem[]>(
        [],
    );

    const [submitting, setSubmitting] = useState(false);
    const [previewProblem, setPreviewProblem] =
        useState<ApiMinimalProblem | null>(null);

    const previewQuery = api.problem.getProblemPreview.useQuery(
        { id: previewProblem?.id ?? 0 },
        { enabled: !!previewProblem },
    );

    const createContest = api.contest.create.useMutation();
    const addProblem = api.contest.addProblem.useMutation();

    // Filter out already-selected problems and match the search query
    const filteredProblems = allProblems.filter(
        (p) =>
            !selectedProblems.some((s) => s.apiProblemId === p.id) &&
            p.name.toLowerCase().includes(problemSearch.toLowerCase()),
    );

    const handleAddProblem = (p: ApiMinimalProblem) => {
        setSelectedProblems((prev) => [
            ...prev,
            {
                apiProblemId: p.id,
                name: p.name,
                label: autoLabel(prev.length),
                maxPoints: 60,
            },
        ]);
    };

    const handleRemoveProblem = (idx: number) => {
        setSelectedProblems((prev) => {
            const next = prev.filter((_, i) => i !== idx);
            // Re-assign auto-labels to preserve A, B, C order
            return next.map((p, i) => ({ ...p, label: autoLabel(i) }));
        });
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error("Contest name is required");
            return;
        }
        if (!startsAt || !endsAt) {
            toast.error("Start and end date/times are required");
            return;
        }
        if (new Date(startsAt) >= new Date(endsAt)) {
            toast.error("End time must be after start time");
            return;
        }
        const userId = session?.user?.id;
        if (!userId) {
            toast.error("You must be signed in to create a contest");
            return;
        }

        setSubmitting(true);
        try {
            const created = await createContest.mutateAsync({
                name: name.trim(),
                description,
                startsAt: new Date(startsAt).toISOString(),
                endsAt: new Date(endsAt).toISOString(),
                scoringMode,
                penaltyPoints:
                    scoringMode === "penalty" ? penaltyPoints : undefined,
                createdBy: userId,
            });

            // Add problems sequentially to preserve display order
            for (let i = 0; i < selectedProblems.length; i++) {
                const p = selectedProblems[i]!;
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

    const isAlreadyAdded = (id: number) =>
        selectedProblems.some((s) => s.apiProblemId === id);

    return (
        <div className="min-h-screen bg-gray-50 px-8 pt-20 pb-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold">New Contest</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Fill in the details below, then pick problems.
                </p>
            </div>

            <div className="max-w-5xl space-y-6">
                {/* ── Section 1: Contest details ─────────────────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle>Contest Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                placeholder="Spring Invitational 2025"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Optional description shown to participants"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startsAt">Start</Label>
                                <Input
                                    id="startsAt"
                                    type="datetime-local"
                                    value={startsAt}
                                    onChange={(e) =>
                                        setStartsAt(e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endsAt">End</Label>
                                <Input
                                    id="endsAt"
                                    type="datetime-local"
                                    value={endsAt}
                                    onChange={(e) => setEndsAt(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="scoringMode">Scoring Mode</Label>
                            <Select
                                value={scoringMode}
                                onValueChange={(v) =>
                                    setScoringMode(v as "simple" | "penalty")
                                }
                            >
                                <SelectTrigger id="scoringMode">
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
                                <Label htmlFor="penaltyPoints">
                                    Penalty Points per Wrong Attempt
                                </Label>
                                <Input
                                    id="penaltyPoints"
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
                    </CardContent>
                </Card>

                {/* ── Section 2: Problem selection ───────────────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle>Problems</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Two-pane picker */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Left pane — searchable problem list */}
                            <div className="space-y-2">
                                <Label htmlFor="problemSearch">
                                    Search problems
                                </Label>
                                <Input
                                    id="problemSearch"
                                    placeholder="Filter by name…"
                                    value={problemSearch}
                                    onChange={(e) =>
                                        setProblemSearch(e.target.value)
                                    }
                                />
                                {loadingProblems ? (
                                    <div className="flex items-center justify-center rounded-md border py-8 text-sm text-gray-500">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Loading problems…
                                    </div>
                                ) : (
                                    <div className="h-72 overflow-y-auto rounded-md border">
                                        {filteredProblems.length === 0 ? (
                                            <p className="py-6 text-center text-sm text-gray-500">
                                                {allProblems.length === 0
                                                    ? "No problems available"
                                                    : "No matching problems"}
                                            </p>
                                        ) : (
                                            <ul className="divide-y">
                                                {filteredProblems.map((p) => (
                                                    <li
                                                        key={p.id}
                                                        className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 ${
                                                            previewProblem?.id ===
                                                            p.id
                                                                ? "bg-blue-50"
                                                                : ""
                                                        }`}
                                                        onClick={() =>
                                                            setPreviewProblem(p)
                                                        }
                                                    >
                                                        <span className="min-w-0 truncate">
                                                            <span className="mr-2 text-xs text-gray-400">
                                                                #{p.id}
                                                            </span>
                                                            {p.name}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            title="Add to contest"
                                                            disabled={isAlreadyAdded(
                                                                p.id,
                                                            )}
                                                            className="ml-2 shrink-0 rounded p-0.5 text-green-600 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-30"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAddProblem(
                                                                    p,
                                                                );
                                                            }}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Right pane — problem details */}
                            <div className="flex h-full flex-col overflow-hidden rounded-md border bg-white">
                                {previewProblem ? (
                                    <>
                                        {/* Fixed header */}
                                        <div className="shrink-0 border-b px-4 pt-3 pb-2">
                                            <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">
                                                #{previewProblem.id} &middot;
                                                No. {previewProblem.number}
                                            </p>
                                            <h3 className="mt-0.5 text-sm leading-snug font-semibold">
                                                {previewProblem.name}
                                            </h3>
                                            {isAlreadyAdded(
                                                previewProblem.id,
                                            ) && (
                                                <p className="mt-1 text-xs font-medium text-green-600">
                                                    ✓ Already added to this
                                                    contest
                                                </p>
                                            )}
                                        </div>

                                        {/* Tabbed scrollable content */}
                                        <Tabs
                                            defaultValue="description"
                                            className="flex min-h-0 flex-1 flex-col"
                                        >
                                            <TabsList className="mx-3 mt-2 mb-1 w-fit shrink-0">
                                                <TabsTrigger value="description">
                                                    Description
                                                </TabsTrigger>
                                                <TabsTrigger value="io">
                                                    Sample I/O
                                                </TabsTrigger>
                                            </TabsList>

                                            {previewQuery.isLoading ? (
                                                <div className="flex flex-1 items-center justify-center">
                                                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                                </div>
                                            ) : (
                                                <>
                                                    <TabsContent
                                                        value="description"
                                                        className="mt-0 min-h-0 flex-1 overflow-y-auto px-4 pb-2"
                                                    >
                                                        <div className="prose prose-sm max-w-none">
                                                            <Markdown
                                                                remarkPlugins={[
                                                                    remarkGfm,
                                                                    remarkMath,
                                                                ]}
                                                                rehypePlugins={[
                                                                    rehypeMathjax,
                                                                ]}
                                                            >
                                                                {previewQuery
                                                                    .data
                                                                    ?.markdown ||
                                                                    "*No description available.*"}
                                                            </Markdown>
                                                        </div>
                                                    </TabsContent>

                                                    <TabsContent
                                                        value="io"
                                                        className="mt-0 min-h-0 flex-1 overflow-y-auto px-4 pb-2"
                                                    >
                                                        <div className="space-y-3">
                                                            <div>
                                                                <p className="mb-1 text-xs font-medium text-gray-500">
                                                                    Sample Input
                                                                </p>
                                                                <pre className="bg-muted overflow-x-auto rounded p-2 font-mono text-xs whitespace-pre-wrap">
                                                                    {previewQuery
                                                                        .data
                                                                        ?.sampleInput ??
                                                                        "No input given for this problem."}
                                                                </pre>
                                                            </div>
                                                            <div>
                                                                <p className="mb-1 text-xs font-medium text-gray-500">
                                                                    Sample
                                                                    Output
                                                                </p>
                                                                <pre className="bg-muted overflow-x-auto rounded p-2 font-mono text-xs whitespace-pre-wrap">
                                                                    {previewQuery
                                                                        .data
                                                                        ?.sampleOutput ??
                                                                        "No output given for this problem."}
                                                                </pre>
                                                            </div>
                                                        </div>
                                                    </TabsContent>
                                                </>
                                            )}
                                        </Tabs>

                                        {/* Fixed footer */}
                                        <div className="shrink-0 border-t p-3">
                                            <Button
                                                className="w-full"
                                                disabled={isAlreadyAdded(
                                                    previewProblem.id,
                                                )}
                                                onClick={() =>
                                                    handleAddProblem(
                                                        previewProblem,
                                                    )
                                                }
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                {isAlreadyAdded(
                                                    previewProblem.id,
                                                )
                                                    ? "Already added"
                                                    : "Add to contest"}
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex h-full items-center justify-center p-6 text-center text-sm text-gray-400">
                                        Click a problem on the left to preview
                                        it here.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Selected problems */}
                        {selectedProblems.length > 0 && (
                            <div className="space-y-2">
                                <Label>Selected Problems</Label>
                                <div className="space-y-2">
                                    {selectedProblems.map((p, idx) => (
                                        <div
                                            key={p.apiProblemId}
                                            className="flex items-center gap-2 rounded-md border bg-white p-2"
                                        >
                                            <span className="min-w-0 flex-1 truncate text-sm">
                                                {p.name}
                                            </span>
                                            <div className="flex shrink-0 items-center gap-1">
                                                <Label className="text-xs text-gray-500">
                                                    Label
                                                </Label>
                                                <Input
                                                    className="h-7 w-14 px-1 text-center text-xs"
                                                    value={p.label}
                                                    onChange={(e) =>
                                                        setSelectedProblems(
                                                            (prev) =>
                                                                prev.map(
                                                                    (x, i) =>
                                                                        i ===
                                                                        idx
                                                                            ? {
                                                                                  ...x,
                                                                                  label: e
                                                                                      .target
                                                                                      .value,
                                                                              }
                                                                            : x,
                                                                ),
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
                                                    value={p.maxPoints}
                                                    onChange={(e) =>
                                                        setSelectedProblems(
                                                            (prev) =>
                                                                prev.map(
                                                                    (x, i) =>
                                                                        i ===
                                                                        idx
                                                                            ? {
                                                                                  ...x,
                                                                                  maxPoints:
                                                                                      parseInt(
                                                                                          e
                                                                                              .target
                                                                                              .value,
                                                                                      ) ||
                                                                                      0,
                                                                              }
                                                                            : x,
                                                                ),
                                                        )
                                                    }
                                                />
                                            </div>
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
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ── Actions ────────────────────────────────────────────── */}
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
