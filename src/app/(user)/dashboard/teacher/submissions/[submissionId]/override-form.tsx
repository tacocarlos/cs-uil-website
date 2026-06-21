"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { ShieldAlert } from "lucide-react";
import CalculateScore from "~/lib/problems/judge/calculate-score";

type SubmissionRow = {
    id: string;
    accepted: boolean | null;
    points: number;
    maxPoints: number;
    numAttempts: number;
};

export function OverrideForm({ submission }: { submission: SubmissionRow }) {
    const router = useRouter();
    const [accepted, setAccepted] = useState<boolean>(
        submission.accepted ?? false,
    );
    const [points, setPoints] = useState<number>(submission.points);

    const [stdPts, uilPts] = [
        CalculateScore(submission.numAttempts),
        CalculateScore(submission.numAttempts, {
            scoringType: "UIL",
            maxPoints: 60,
        }),
    ];

    const override = api.submission.overrideSubmission.useMutation({
        onSuccess: () => {
            toast.success("Judgement overridden");
            router.refresh();
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        override.mutate({ submissionId: submission.id, accepted, points });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-amber-500" />
                    Override Judgement
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="flex items-center justify-between rounded-md border p-4">
                        <div>
                            <p className="font-medium">Accept submission</p>
                            <p className="text-muted-foreground text-sm">
                                Mark this submission as passing.
                            </p>
                        </div>
                        <Switch
                            checked={accepted}
                            onCheckedChange={setAccepted}
                        />
                    </div>

                    <div>
                        <Label>Points</Label>
                        <span className="text-muted-foreground text-sm">
                            Regular Scoring Points: {stdPts}
                        </span>
                        <br />
                        <span className="text-muted-foreground text-sm">
                            UIL Scoring Points: {uilPts}
                        </span>
                        <div className="mt-1.5 flex items-center gap-2">
                            <Input
                                type="number"
                                min={0}
                                max={submission.maxPoints}
                                value={points}
                                onChange={(e) =>
                                    setPoints(Number(e.target.value))
                                }
                                className="w-24"
                            />
                            <span className="text-muted-foreground text-sm">
                                / {submission.maxPoints}
                            </span>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={override.isPending}
                        className="w-full"
                    >
                        {override.isPending ? "Saving…" : "Save Override"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
