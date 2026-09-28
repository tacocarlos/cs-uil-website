"use client";

import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { api } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";
import type { Problem } from "~/server/db/schema/types";
import type { ContestStatus } from "~/server/db/schema/contest";
import { CodeEditor } from "~/components/problem-workspace/code-editor";
import {
    LanguageSelect,
    ResetCodeButton,
    RunButton,
    SubmitButton,
} from "~/components/problem-workspace/editor-controls";
import { IOPanel } from "~/components/problem-workspace/io-panel";
import {
    EditorPane,
    ProblemSidebar,
    ProblemWorkspace,
} from "~/components/problem-workspace/layout";
import ProblemStatement from "~/components/problem-workspace/problem-statement";
import { useCodeEditor } from "~/components/problem-workspace/use-code-editor";
import { useRunCode } from "~/components/problem-workspace/use-run-code";
import { useTestIO } from "~/components/problem-workspace/use-test-io";

type BestSubmission = {
    accepted: boolean;
    points: number;
    attemptNumber: number;
};

interface ContestEditorProps {
    problem: Problem;
    contestProblem: {
        id: number;
        contestId: number;
        apiProblemId: number;
        label: string;
        maxPoints: number;
    };
    contestStatus: ContestStatus;
}

export default function ContestEditor({
    problem,
    contestProblem,
    contestStatus,
}: ContestEditorProps) {
    const { contestId, apiProblemId, maxPoints } = contestProblem;

    const storagePrefix = `contest-${contestId}-problem-${apiProblemId}`;
    const codeEditor = useCodeEditor(storagePrefix);
    const io = useTestIO(storagePrefix, problem.defaultInputFile ?? "");
    const { run, isRunning } = useRunCode(codeEditor, io);

    const utils = api.useUtils();

    const { data: bestPerProblem } = api.contest.getMyBestPerProblem.useQuery({
        contestId,
    });
    const myBest = bestPerProblem?.find((b) => b.apiProblemId === apiProblemId);

    const submitMutation = api.contest.submitCode.useMutation({
        onSuccess: async (data) => {
            await utils.contest.getMyBestPerProblem.invalidate({ contestId });
            // Mirror run output so the user can see what happened.
            io.showOutput({
                stdout: data.stdout,
                stderr: data.stderr ?? data.compileOutput,
            });
            toast(
                data.accepted
                    ? `✓ Accepted — ${data.points} / ${maxPoints} pts`
                    : `✗ Denied — attempt #${data.attemptNumber}`,
            );
        },
        onError: (err) => {
            toast(`Submission failed: ${err.message}`);
        },
    });

    function submit() {
        const code = codeEditor.getCode();
        if (code === null) return;
        toast("Submitting solution...");
        submitMutation.mutate({
            contestId,
            apiProblemId,
            code,
            languageId: codeEditor.language.id,
        });
    }

    const isActive = contestStatus === "active";

    return (
        <ProblemWorkspace
            sidebar={
                <ProblemSidebar
                    tabs={[
                        {
                            value: "problem-statement",
                            label: "Description",
                            className: "prose prose-slate max-w-none",
                            content: <ProblemStatement problem={problem} />,
                        },
                        {
                            value: "submissions",
                            label: "Submissions",
                            content: (
                                <ContestProgress
                                    best={myBest}
                                    maxPoints={maxPoints}
                                />
                            ),
                        },
                    ]}
                />
            }
        >
            <EditorPane
                toolbar={
                    <>
                        <div className="flex items-center gap-3">
                            <Link
                                href={`/contest/${contestId}`}
                                className="flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-slate-200"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to contest
                            </Link>
                            <span className="text-slate-600">|</span>
                            <LanguageSelect editor={codeEditor} />
                        </div>
                        <div className="flex items-center gap-3">
                            {myBest?.accepted && (
                                <Badge className="bg-green-600 text-white hover:bg-green-600">
                                    Accepted — {myBest.points} / {maxPoints} pts
                                </Badge>
                            )}
                            {!isActive && (
                                <Badge
                                    variant="outline"
                                    className="border-amber-500 text-amber-400"
                                >
                                    Contest {contestStatus}
                                </Badge>
                            )}
                            <ResetCodeButton editor={codeEditor} />
                        </div>
                    </>
                }
                editor={<CodeEditor editor={codeEditor} />}
                io={<IOPanel io={io} />}
                footer={
                    <>
                        <RunButton onRun={run} isRunning={isRunning} />
                        <SubmitButton
                            onSubmit={submit}
                            isSubmitting={submitMutation.isPending}
                            disabledReason={
                                isActive ? undefined : "Contest not active"
                            }
                        />
                    </>
                }
            />
        </ProblemWorkspace>
    );
}

function ContestProgress({
    best,
    maxPoints,
}: {
    best: BestSubmission | undefined;
    maxPoints: number;
}) {
    return (
        <>
            <h3 className="mb-4 text-base font-semibold text-slate-700">
                My Contest Progress
            </h3>
            {!best ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <XCircle className="h-4 w-4 text-slate-400" />
                    No submissions yet.
                </div>
            ) : best.accepted ? (
                <div className="rounded-md border border-green-200 bg-green-50 p-4">
                    <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-semibold">Accepted</span>
                    </div>
                    <p className="mt-2 text-sm text-green-600">
                        Score:{" "}
                        <span className="font-semibold">
                            {best.points} / {maxPoints} pts
                        </span>
                    </p>
                    <p className="text-sm text-green-600">
                        Accepted on attempt #{best.attemptNumber}
                    </p>
                </div>
            ) : (
                <div className="rounded-md border border-red-200 bg-red-50 p-4">
                    <div className="flex items-center gap-2 text-red-700">
                        <XCircle className="h-5 w-5" />
                        <span className="font-semibold">Not yet accepted</span>
                    </div>
                    <p className="mt-2 text-sm text-red-600">
                        {best.attemptNumber}{" "}
                        {best.attemptNumber === 1 ? "attempt" : "attempts"} so
                        far
                    </p>
                </div>
            )}
        </>
    );
}
