"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import type { InvitedSchool } from "./contest-settings";

/** Search for schools by name and pick the ones invited to a contest. */
export function SchoolInvitePicker({
    value,
    onChange,
}: {
    value: InvitedSchool[];
    onChange: (schools: InvitedSchool[]) => void;
}) {
    const [search, setSearch] = useState("");
    const query = useDebouncedValue(search.trim());
    const { data: results, isFetching } = api.school.lookup.useQuery(
        { query },
        { enabled: query.length > 0 },
    );

    const invited = new Set(value.map((s) => s.id));
    const matches = (results ?? []).filter((s) => !invited.has(s.id));

    return (
        <div className="space-y-2">
            {value.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {value.map((school) => (
                        <Badge
                            key={school.id}
                            variant="secondary"
                            className="gap-1 py-1 pr-1"
                        >
                            {school.name}
                            <button
                                type="button"
                                aria-label={`Remove ${school.name}`}
                                className="rounded-sm hover:bg-gray-300"
                                onClick={() =>
                                    onChange(
                                        value.filter((s) => s.id !== school.id),
                                    )
                                }
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            <Input
                type="search"
                placeholder="Search schools to invite"
                aria-label="Search schools to invite"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {query && (
                <ul className="divide-y rounded-md border">
                    {matches.map((school) => (
                        <li key={school.id}>
                            <button
                                type="button"
                                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
                                onClick={() => {
                                    onChange([
                                        ...value,
                                        { id: school.id, name: school.name },
                                    ]);
                                    setSearch("");
                                }}
                            >
                                <span>
                                    {school.name}
                                    {school.conference && (
                                        <span className="text-muted-foreground ml-2 text-xs">
                                            {school.conference}
                                        </span>
                                    )}
                                </span>
                                <Plus className="h-4 w-4" />
                            </button>
                        </li>
                    ))}
                    {matches.length === 0 && (
                        <li className="text-muted-foreground px-3 py-2 text-sm">
                            {isFetching
                                ? "Searching…"
                                : "No other schools match."}
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}
