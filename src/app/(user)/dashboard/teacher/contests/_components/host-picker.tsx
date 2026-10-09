"use client";

import { useState } from "react";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { Input } from "~/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";
import type { InvitedSchool } from "./contest-settings";

/**
 * Site admins only: a global contest (null) or one hosted by a school.
 * Hosted contests are managed by that school's teachers as well.
 */
export function HostPicker({
    value,
    onChange,
    onKindChange,
}: {
    value: InvitedSchool | null;
    onChange: (host: InvitedSchool | null) => void;
    /** Global vs. hosted, chosen before a host school is picked. */
    onKindChange: (kind: "global" | "school") => void;
}) {
    const [kind, setKind] = useState<"global" | "school">(
        value ? "school" : "global",
    );
    const [search, setSearch] = useState("");
    const query = useDebouncedValue(search.trim());
    const { data: results, isFetching } = api.school.lookup.useQuery(
        { query },
        { enabled: kind === "school" && query.length > 0 },
    );

    return (
        <div className="space-y-2">
            <Select
                value={kind}
                onValueChange={(v) => {
                    const next = v as "global" | "school";
                    setKind(next);
                    onKindChange(next);
                }}
            >
                <SelectTrigger aria-label="Contest type">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="global">
                        Global contest (every school)
                    </SelectItem>
                    <SelectItem value="school">Hosted by a school</SelectItem>
                </SelectContent>
            </Select>

            {kind === "school" && (
                <div className="space-y-2">
                    <p className="text-sm">
                        Host:{" "}
                        {value ? (
                            <span className="font-medium">{value.name}</span>
                        ) : (
                            <span className="text-muted-foreground">
                                pick a school below
                            </span>
                        )}
                    </p>
                    <Input
                        type="search"
                        placeholder="Search schools to host"
                        aria-label="Search schools to host"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {query && (
                        <ul className="divide-y rounded-md border">
                            {(results ?? []).map((school) => (
                                <li key={school.id}>
                                    <button
                                        type="button"
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                                        onClick={() => {
                                            onChange({
                                                id: school.id,
                                                name: school.name,
                                            });
                                            setSearch("");
                                        }}
                                    >
                                        {school.name}
                                    </button>
                                </li>
                            ))}
                            {results?.length === 0 && (
                                <li className="text-muted-foreground px-3 py-2 text-sm">
                                    {isFetching
                                        ? "Searching…"
                                        : "No schools match."}
                                </li>
                            )}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
