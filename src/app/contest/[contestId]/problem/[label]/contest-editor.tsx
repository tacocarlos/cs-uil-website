"use client";

import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { api } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";
import { Countdown } from "~/components/contest/countdown";
import { RefreshAt } from "~/components/contest/refresh-at";
import type { Problem } from "~/server/db/schema/types";
import { isInProgress, type ContestStatus } from "~/lib/contest/status";
import { JUDGE0_STATUS } from "~/lib/problems/execute/judge0-result";
import { CodeEditor } from "~/components/problem-workspace/code-editor";
import {
    LanguageSelect,
    ResetCodeButton,
    RunButton,
    SubmitButton,
} from "~/components/problem-workspace/editor-controls";
import { EditorOptionsMenu } from "~/components/problem-workspace/editor-options-menu";
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
    msUntilEnd: number;
}

export default function ContestEditor({
    problem,
    contestProblem,
    contestStatus,
    msUntilEnd,
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
            // Program output on the hidden data isn't sent back, but show
            // why a submission failed to compile or run.
            const error =
                data.compileOutput ??
                (data.status.id !== JUDGE0_STATUS.ACCEPTED
                    ? data.status.description
                    : null);
            if (error) io.showOutput({ stderr: error });
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
    const inProgress = isInProgress(contestStatus);

    return (
        <ProblemWorkspace
            sidebar={
                <ProblemSidebar
                    tabs={[
                        {
                            value: "problem-statement",
                            label: "Description",
                            className: "prose max-w-none",
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
                                aria-label="Back to contest"
                                className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">
                                    Back to contest
                                </span>
                            </Link>
                            <span className="text-border">|</span>
                            <LanguageSelect editor={codeEditor} />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            {inProgress && (
                                <>
                                    {/* Disables Submit once time is up. */}
                                    <RefreshAt inMs={msUntilEnd} />
                                    <span className="text-muted-foreground text-sm">
                                        Ends{" "}
                                        <Countdown
                                            inMs={msUntilEnd}
                                            prefix="in "
                                            doneText="now"
                                            exact
                                        />
                                    </span>
                                </>
                            )}
                            {myBest?.accepted && (
                                <Badge className="bg-success text-success-foreground">
                                    Accepted — {myBest.points} / {maxPoints} pts
                                </Badge>
                            )}
                            {!isActive && (
                                <Badge
                                    variant="outline"
                                    className="border-warning text-warning"
                                >
                                    Contest {contestStatus}
                                </Badge>
                            )}
                            <EditorOptionsMenu editor={codeEditor} />
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
            <h3 className="mb-4 text-base font-semibold">
                My Contest Progress
            </h3>
            {!best ? (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <XCircle className="h-4 w-4" />
                    No submissions yet.
                </div>
            ) : best.accepted ? (
                <div className="border-success/30 bg-success/10 text-success rounded-md border p-4">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-semibold">Accepted</span>
                    </div>
                    <p className="mt-2 text-sm">
                        Score:{" "}
                        <span className="font-semibold">
                            {best.points} / {maxPoints} pts
                        </span>
                    </p>
                    <p className="text-sm">
                        Accepted on attempt #{best.attemptNumber}
                    </p>
                </div>
            ) : (
                <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border p-4">
                    <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5" />
                        <span className="font-semibold">Not yet accepted</span>
                    </div>
                    <p className="mt-2 text-sm">
                        {best.attemptNumber}{" "}
                        {best.attemptNumber === 1 ? "attempt" : "attempts"} so
                        far
                    </p>
                </div>
            )}
        </>
    );
}
