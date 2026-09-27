import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import type { ContestStatus } from "~/server/db/schema/contest";

const STATUS_COLORS: Record<ContestStatus, string> = {
    draft: "bg-gray-100 text-gray-800",
    scheduled: "bg-blue-100 text-blue-800",
    active: "bg-green-100 text-green-800",
    frozen: "bg-amber-100 text-amber-800",
    ended: "bg-slate-100 text-slate-600",
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
    /** Show "Upcoming"/"Live" instead of the raw status name. */
    friendly?: boolean;
    className?: string;
}) {
    return (
        <Badge className={cn(STATUS_COLORS[status], className)}>
            {friendly ? FRIENDLY_LABELS[status] : status}
        </Badge>
    );
}
