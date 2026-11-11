"use client";

import { toast } from "sonner";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import { Switch } from "~/components/ui/switch";
import { formatPracticeTime } from "~/lib/prairielearn/practice-tests";
import { api } from "~/trpc/react";

/**
 * Turns the PrairieLearn practice-test leaderboard on or off for a school.
 * Once it's on, the school's teachers connect their course from their
 * dashboard.
 */
export function PrairieLearnCourse({
    organizationId,
}: {
    organizationId: string;
}) {
    const utils = api.useUtils();
    const { data: status, isPending } = api.prairielearn.getAccess.useQuery({
        organizationId,
    });
    const setEnabled = api.prairielearn.setEnabled.useMutation({
        onSuccess: async (_, { enabled }) => {
            toast.success(
                enabled
                    ? "PrairieLearn practice tests turned on"
                    : "PrairieLearn practice tests turned off",
            );
            await utils.prairielearn.getAccess.invalidate({ organizationId });
        },
        onError: (err) => toast.error(err.message),
    });

    if (isPending) return <Skeleton className="h-16 w-full" />;
    const enabled = status != null;

    return (
        <section className="space-y-2">
            <div className="flex items-center justify-between gap-4">
                <Label
                    htmlFor={`prairielearn-${organizationId}`}
                    className="text-sm font-medium"
                >
                    PrairieLearn practice tests
                </Label>
                <Switch
                    id={`prairielearn-${organizationId}`}
                    checked={enabled}
                    disabled={setEnabled.isPending}
                    onCheckedChange={(checked) => {
                        if (
                            !checked &&
                            status?.connected &&
                            !confirm(
                                "Turn off PrairieLearn practice tests for this school? Its connection, saved token, copied results, and student links are deleted (nothing changes in PrairieLearn).",
                            )
                        ) {
                            return;
                        }
                        setEnabled.mutate({ organizationId, enabled: checked });
                    }}
                />
            </div>
            <p className="text-muted-foreground text-sm">
                {!enabled
                    ? "Gives the school a practice-test leaderboard from its PrairieLearn course. Its teachers connect the course."
                    : !status.connected
                      ? "On. Waiting for a teacher to connect the school's PrairieLearn course from their dashboard."
                      : `Connected to ${status.name}${status.connectedByName ? ` by ${status.connectedByName}` : ""}${status.syncedAt ? ` · copied ${formatPracticeTime(status.syncedAt)}` : ""}.`}
            </p>
            {status?.syncError && (
                <p className="text-destructive text-xs">{status.syncError}</p>
            )}
        </section>
    );
}
