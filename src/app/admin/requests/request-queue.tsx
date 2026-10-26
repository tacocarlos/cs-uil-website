"use client";

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    CATEGORY_LABELS,
    STATUS_LABELS,
    type FeatureRequestCategory,
    type FeatureRequestStatus,
} from "~/components/feature-request/labels";
import { StatusBadge } from "~/components/feature-request/status-badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { Textarea } from "~/components/ui/textarea";
import { api, type RouterOutputs } from "~/trpc/react";

type Request = RouterOutputs["featureRequest"]["getAll"][number];

const ALL = "all";

/** Every submitted request, filterable, each with a form to respond. */
export function RequestQueue() {
    const [status, setStatus] = useState<FeatureRequestStatus | typeof ALL>(
        "pending",
    );
    const [category, setCategory] = useState<
        FeatureRequestCategory | typeof ALL
    >(ALL);

    const {
        data: requests,
        isPending,
        isFetching,
    } = api.featureRequest.getAll.useQuery(
        {
            status: status === ALL ? undefined : status,
            category: category === ALL ? undefined : category,
        },
        { placeholderData: keepPreviousData },
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    <Select
                        value={status}
                        onValueChange={(value) =>
                            setStatus(value as typeof status)
                        }
                    >
                        <SelectTrigger
                            className="w-44"
                            aria-label="Filter by status"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All statuses</SelectItem>
                            {Object.entries(STATUS_LABELS).map(
                                ([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ),
                            )}
                        </SelectContent>
                    </Select>
                    <Select
                        value={category}
                        onValueChange={(value) =>
                            setCategory(value as typeof category)
                        }
                    >
                        <SelectTrigger
                            className="w-44"
                            aria-label="Filter by category"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All categories</SelectItem>
                            {Object.entries(CATEGORY_LABELS).map(
                                ([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ),
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {isPending ? (
                    <Skeleton className="h-24 w-full" />
                ) : !requests?.length ? (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                        No requests match these filters.
                    </p>
                ) : (
                    <ul
                        className={`divide-y ${isFetching ? "opacity-60" : ""}`}
                    >
                        {requests.map((request) => (
                            <RequestItem
                                // Remount when the saved response changes, so
                                // the form resets to it.
                                key={`${request.id}-${request.featureStatus}-${request.adminResponse}`}
                                request={request}
                            />
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

function RequestItem({ request }: { request: Request }) {
    const utils = api.useUtils();
    const [status, setStatus] = useState(request.featureStatus);
    const [response, setResponse] = useState(request.adminResponse ?? "");

    const respond = api.featureRequest.respond.useMutation({
        onSuccess: async () => {
            toast.success("Response saved");
            await utils.featureRequest.getAll.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });

    const unchanged =
        status === request.featureStatus &&
        response.trim() === (request.adminResponse ?? "");

    return (
        <li className="space-y-3 py-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
                <StatusBadge status={request.featureStatus} />
                <span className="font-medium">
                    {CATEGORY_LABELS[request.category]}
                </span>
                <span className="text-muted-foreground">
                    from {request.submitter.name} on{" "}
                    {request.timeSubmitted.toLocaleDateString()}
                </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{request.message}</p>
            <form
                className="space-y-2"
                onSubmit={(e) => {
                    e.preventDefault();
                    respond.mutate({
                        id: request.id,
                        featureStatus: status,
                        adminResponse: response,
                    });
                }}
            >
                <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Reply to the submitter (optional)"
                    aria-label="Response to the submitter"
                    rows={2}
                    maxLength={2000}
                />
                <div className="flex items-center gap-2">
                    <Select
                        value={status}
                        onValueChange={(value) =>
                            setStatus(value as FeatureRequestStatus)
                        }
                    >
                        <SelectTrigger className="h-8 w-36" aria-label="Status">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(STATUS_LABELS).map(
                                ([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ),
                            )}
                        </SelectContent>
                    </Select>
                    <Button
                        type="submit"
                        size="sm"
                        disabled={respond.isPending || unchanged}
                    >
                        {respond.isPending ? "Saving…" : "Save"}
                    </Button>
                </div>
            </form>
        </li>
    );
}
