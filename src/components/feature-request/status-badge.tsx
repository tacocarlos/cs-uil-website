import { Badge } from "~/components/ui/badge";
import {
    STATUS_BADGE_VARIANTS,
    STATUS_LABELS,
    type FeatureRequestStatus,
} from "./labels";

export function StatusBadge({ status }: { status: FeatureRequestStatus }) {
    return (
        <Badge variant={STATUS_BADGE_VARIANTS[status]}>
            {STATUS_LABELS[status]}
        </Badge>
    );
}
