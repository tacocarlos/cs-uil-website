"use client";

import { Badge } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";

/**
 * Toggle for the teacher's written views: former students (graduated or
 * left) are hidden unless included, e.g. to look at past seasons' trends.
 */
export function IncludeFormerCheckbox({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <div className="flex items-center gap-2">
            <Checkbox
                id="include-former"
                checked={checked}
                onCheckedChange={(value) => onChange(value === true)}
            />
            <Label htmlFor="include-former" className="text-sm font-normal">
                Include former students
            </Label>
        </div>
    );
}

/** Marks a former student next to their name. */
export function FormerBadge() {
    return (
        <Badge variant="outline" className="text-muted-foreground ml-2">
            Former
        </Badge>
    );
}
