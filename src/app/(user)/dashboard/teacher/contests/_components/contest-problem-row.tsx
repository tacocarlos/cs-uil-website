import type { ReactNode } from "react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

/** One problem in a contest, with editable label and max points. */
export function ContestProblemRow({
    title,
    label,
    maxPoints,
    onChange,
    actions,
}: {
    title: ReactNode;
    label: string;
    maxPoints: number;
    onChange: (patch: { label?: string; maxPoints?: number }) => void;
    /** Buttons shown at the end of the row. */
    actions: ReactNode;
}) {
    return (
        <div className="flex items-center gap-2 rounded-md border bg-white p-2">
            <span className="min-w-0 flex-1 truncate text-sm">{title}</span>
            <div className="flex shrink-0 items-center gap-1">
                <Label className="text-xs text-gray-500">Label</Label>
                <Input
                    className="h-7 w-14 px-1 text-center text-xs"
                    value={label}
                    onChange={(e) => onChange({ label: e.target.value })}
                />
            </div>
            <div className="flex shrink-0 items-center gap-1">
                <Label className="text-xs text-gray-500">Pts</Label>
                <Input
                    className="h-7 w-16 px-1 text-center text-xs"
                    type="number"
                    min={0}
                    value={maxPoints}
                    onChange={(e) =>
                        onChange({ maxPoints: parseInt(e.target.value) || 0 })
                    }
                />
            </div>
            {actions}
        </div>
    );
}
