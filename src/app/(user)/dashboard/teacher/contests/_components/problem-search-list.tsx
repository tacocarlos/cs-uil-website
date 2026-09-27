import { useId, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import type { ApiMinimalProblem } from "~/lib/api/lunaghs";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

/**
 * Searchable list of problems from the problems API, hiding any whose ID is in
 * `excludeIds`. Clicking a row calls `onSelect`; `renderAction` adds a
 * trailing element (e.g. an add button) to each row.
 */
export function ProblemSearchList({
    problems,
    isLoading,
    excludeIds,
    search,
    onSearchChange,
    onSelect,
    selectedId,
    renderAction,
    label,
    listClassName,
}: {
    problems: ApiMinimalProblem[];
    isLoading: boolean;
    excludeIds: Set<number>;
    search: string;
    onSearchChange: (search: string) => void;
    onSelect: (problem: ApiMinimalProblem) => void;
    selectedId?: number;
    renderAction?: (problem: ApiMinimalProblem) => ReactNode;
    label?: string;
    /** Sets the list's height, e.g. "h-72". */
    listClassName?: string;
}) {
    const inputId = useId();
    const query = search.toLowerCase();
    const visible = problems.filter(
        (p) => !excludeIds.has(p.id) && p.name.toLowerCase().includes(query),
    );

    return (
        <div className="space-y-2">
            {label && <Label htmlFor={inputId}>{label}</Label>}
            <Input
                id={inputId}
                placeholder="Search problems by name…"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
            />

            {isLoading ? (
                <div className="flex items-center justify-center rounded-md border py-8 text-sm text-gray-500">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading problems…
                </div>
            ) : (
                <div
                    className={cn(
                        "overflow-y-auto rounded-md border",
                        listClassName,
                    )}
                >
                    {visible.length === 0 ? (
                        <p className="py-6 text-center text-sm text-gray-500">
                            {problems.length === 0
                                ? "No problems available"
                                : "No matching problems"}
                        </p>
                    ) : (
                        <ul className="divide-y">
                            {visible.map((p) => (
                                <li
                                    key={p.id}
                                    className={cn(
                                        "flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-gray-50",
                                        selectedId === p.id && "bg-blue-50",
                                    )}
                                    onClick={() => onSelect(p)}
                                >
                                    <span className="min-w-0 truncate">
                                        <span className="mr-2 text-xs text-gray-400">
                                            #{p.id}
                                        </span>
                                        {p.name}
                                    </span>
                                    {renderAction?.(p)}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
