import { Badge } from "~/components/ui/badge";

/** Marks the sign-in option this browser used last time. */
export function LastUsedBadge() {
    return (
        <Badge
            variant="secondary"
            className="absolute -top-2.5 right-3 shadow-sm"
        >
            Last used
        </Badge>
    );
}
