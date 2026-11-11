"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import { formatPracticeTime } from "~/lib/prairielearn/practice-tests";
import { api, type RouterOutputs } from "~/trpc/react";
import { PracticeTestLinks } from "./practice-test-links";

type Status = NonNullable<RouterOutputs["prairielearn"]["getStatus"]>;

/**
 * The school's PrairieLearn connection (a form to make or change it, or a
 * summary), and once connected, the students to link.
 */
export function PracticeTestSetup() {
    const { data: status, isPending } = api.prairielearn.getStatus.useQuery();
    const [editing, setEditing] = useState(false);

    if (isPending) return <Skeleton className="h-40 w-full" />;
    if (!status) {
        return (
            <p className="text-muted-foreground text-sm">
                PrairieLearn practice tests aren&apos;t turned on for your
                school.
            </p>
        );
    }

    return (
        <div className="space-y-4">
            {!status.connected || editing ? (
                <ConnectionForm
                    status={status}
                    onDone={() => setEditing(false)}
                    onCancel={status.connected ? () => setEditing(false) : null}
                />
            ) : (
                <ConnectionSummary
                    status={status}
                    onChange={() => setEditing(true)}
                />
            )}
            {status.connected && <PracticeTestLinks />}
        </div>
    );
}

function ConnectionSummary({
    status,
    onChange,
}: {
    status: Status;
    onChange: () => void;
}) {
    const utils = api.useUtils();
    const disconnect = api.prairielearn.disconnect.useMutation({
        onSuccess: async () => {
            toast.success("Disconnected from PrairieLearn");
            await utils.prairielearn.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });

    return (
        <div className="bg-card text-card-foreground flex flex-wrap items-start justify-between gap-3 rounded-xl border p-4 shadow-sm">
            <div className="min-w-0 text-sm">
                <p className="font-medium">{status.name}</p>
                <p className="text-muted-foreground">
                    Course instance {status.courseInstanceId} on{" "}
                    {status.serverUrl}
                    {status.connectedByName &&
                        status.connectedAt &&
                        `, connected by ${status.connectedByName} ${formatPracticeTime(status.connectedAt)}`}
                </p>
            </div>
            <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={onChange}>
                    Change
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    disabled={disconnect.isPending}
                    onClick={() => {
                        if (
                            confirm(
                                "Disconnect PrairieLearn? The saved token, copied results, and student links are deleted here (nothing changes in PrairieLearn).",
                            )
                        ) {
                            disconnect.mutate();
                        }
                    }}
                >
                    Disconnect
                </Button>
            </div>
        </div>
    );
}

function ConnectionForm({
    status,
    onDone,
    onCancel,
}: {
    status: Status;
    onDone: () => void;
    /** Null when there's no connection to go back to. */
    onCancel: (() => void) | null;
}) {
    const utils = api.useUtils();
    const [serverUrl, setServerUrl] = useState(
        status.serverUrl ?? "https://us.prairielearn.com",
    );
    const [courseInstanceId, setCourseInstanceId] = useState(
        status.courseInstanceId ?? "",
    );
    const [token, setToken] = useState("");
    // The saved token can be kept while the server stays the same.
    const keepsToken =
        status.connected && serverUrl.trim() === status.serverUrl;

    const connect = api.prairielearn.connect.useMutation({
        onSuccess: async (connected) => {
            if (connected?.syncError) {
                toast.warning(
                    `Connected to ${connected.name}, but copying results failed: ${connected.syncError}`,
                );
            } else {
                toast.success(
                    `Connected to ${connected?.name ?? "PrairieLearn"}`,
                );
            }
            setToken("");
            onDone();
            await utils.prairielearn.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });

    return (
        <form
            className="bg-card text-card-foreground space-y-4 rounded-xl border p-4 shadow-sm"
            onSubmit={(e) => {
                e.preventDefault();
                connect.mutate({
                    serverUrl,
                    courseInstanceId,
                    token: token || undefined,
                });
            }}
        >
            <div>
                <h2 className="text-lg font-semibold">Connect PrairieLearn</h2>
                <p className="text-muted-foreground text-sm">
                    The leaderboard ranks your students on the practice tests
                    (titled &ldquo;&lt;Level&gt; Practice Test&rdquo;) in a
                    PrairieLearn course instance where you&apos;re an
                    instructor. Your token is stored encrypted and only used to
                    read results; it&apos;s shared by your school&apos;s
                    teachers.
                </p>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="pl-server">PrairieLearn address</Label>
                <Input
                    id="pl-server"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    placeholder="https://us.prairielearn.com"
                    required
                />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="pl-course-instance">Course instance ID</Label>
                <Input
                    id="pl-course-instance"
                    value={courseInstanceId}
                    onChange={(e) => setCourseInstanceId(e.target.value)}
                    placeholder="e.g. 8"
                    inputMode="numeric"
                    required
                />
                <p className="text-muted-foreground text-xs">
                    The number after <code>/course_instance/</code> in the
                    address bar when you open the course in PrairieLearn.
                </p>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="pl-token">Personal access token</Label>
                <Input
                    id="pl-token"
                    type="password"
                    autoComplete="off"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder={
                        keepsToken ? "Leave blank to keep the saved token" : ""
                    }
                    required={!keepsToken}
                />
                <p className="text-muted-foreground text-xs">
                    In PrairieLearn, click your name, then Settings, then
                    &ldquo;Generate new token&rdquo; under Personal Access
                    Tokens.
                </p>
            </div>
            <div className="flex gap-2">
                <Button
                    type="submit"
                    disabled={
                        connect.isPending ||
                        !/^\d+$/.test(courseInstanceId.trim()) ||
                        (!keepsToken && !token.trim())
                    }
                >
                    {connect.isPending ? "Checking…" : "Connect"}
                </Button>
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
            </div>
        </form>
    );
}
