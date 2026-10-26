"use client";

import { toast } from "sonner";
import { CATEGORY_LABELS } from "~/components/feature-request/labels";
import { StatusBadge } from "~/components/feature-request/status-badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";

/** The signed-in user's requests with each one's status and our reply. */
export function MyRequests() {
    const utils = api.useUtils();
    const { data: requests, isPending } = api.featureRequest.getMine.useQuery();
    const withdraw = api.featureRequest.delete.useMutation({
        onSuccess: async () => {
            toast.success("Request withdrawn");
            await utils.featureRequest.getMine.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Your requests</CardTitle>
            </CardHeader>
            <CardContent>
                {isPending ? (
                    <Skeleton className="h-24 w-full" />
                ) : !requests?.length ? (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                        You haven&apos;t submitted any requests yet.
                    </p>
                ) : (
                    <ul className="divide-y">
                        {requests.map((request) => (
                            <li key={request.id} className="space-y-2 py-4">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <StatusBadge
                                            status={request.featureStatus}
                                        />
                                        <span className="font-medium">
                                            {CATEGORY_LABELS[request.category]}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {request.timeSubmitted.toLocaleDateString()}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={withdraw.isPending}
                                        onClick={() => {
                                            if (
                                                confirm(
                                                    "Withdraw this request?",
                                                )
                                            ) {
                                                withdraw.mutate({
                                                    id: request.id,
                                                });
                                            }
                                        }}
                                    >
                                        Withdraw
                                    </Button>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">
                                    {request.message}
                                </p>
                                {request.adminResponse && (
                                    <div className="rounded-md bg-gray-100 p-3 text-sm">
                                        <p className="text-muted-foreground mb-1 text-xs font-semibold uppercase">
                                            Response
                                        </p>
                                        <p className="whitespace-pre-wrap">
                                            {request.adminResponse}
                                        </p>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
