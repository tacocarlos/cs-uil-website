import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import type { ContestStatus } from "~/lib/contest/status";

const STATUS_COLORS: Record<ContestStatus, string> = {
    draft: "bg-muted text-foreground",
    scheduled: "bg-info/15 text-info",
    active: "bg-success/15 text-success",
    frozen: "bg-warning/15 text-warning",
    ended: "bg-muted text-muted-foreground",
};

/** Wording for contest managers. */
const LABELS: Record<ContestStatus, string> = {
    draft: "Draft",
    scheduled: "Scheduled",
    active: "Active",
    frozen: "Frozen",
    ended: "Ended",
};

/** Student-facing wording for each status. */
const FRIENDLY_LABELS: Record<ContestStatus, string> = {
    draft: "Draft",
    scheduled: "Upcoming",
    active: "Live",
    frozen: "Frozen",
    ended: "Ended",
};

export function ContestStatusBadge({
    status,
    friendly = false,
    className,
}: {
    status: ContestStatus;
    /** Show "Upcoming"/"Live" instead of the status name. */
    friendly?: boolean;
    className?: string;
}) {
    return (
        <Badge className={cn(STATUS_COLORS[status], className)}>
            {(friendly ? FRIENDLY_LABELS : LABELS)[status]}
        </Badge>
    );
}
