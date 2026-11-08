"use client";

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { Button } from "~/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "~/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

export type SchoolOption = { id: string; name: string };

/**
 * Picks one school, or all schools (null). Schools are searched on the
 * server by name, since there can be one per Texas high school.
 */
export function SchoolFilter({
    value,
    onChange,
}: {
    value: SchoolOption | null;
    onChange: (school: SchoolOption | null) => void;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const query = useDebouncedValue(search.trim());
    const { data, isFetching } = api.school.search.useQuery(
        { query, page: 0 },
        { enabled: open, placeholderData: keepPreviousData },
    );

    const select = (school: SchoolOption | null) => {
        onChange(school);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    aria-label="Filter by school"
                    className="w-64 justify-between font-normal"
                >
                    <span className="truncate">
                        {value?.name ?? "All schools"}
                    </span>
                    <ChevronsUpDown className="opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
                {/* Filtering happens on the server. */}
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search schools"
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList className={isFetching ? "opacity-60" : ""}>
                        <CommandEmpty>
                            {data ? "No schools found." : "Loading…"}
                        </CommandEmpty>
                        <CommandGroup>
                            {!query && (
                                <CommandItem
                                    value="all"
                                    onSelect={() => select(null)}
                                >
                                    <Check
                                        className={cn(value && "opacity-0")}
                                    />
                                    All schools
                                </CommandItem>
                            )}
                            {data?.schools.map((school) => (
                                <CommandItem
                                    key={school.id}
                                    value={school.id}
                                    onSelect={() =>
                                        select({
                                            id: school.id,
                                            name: school.name,
                                        })
                                    }
                                >
                                    <Check
                                        className={cn(
                                            value?.id !== school.id &&
                                                "opacity-0",
                                        )}
                                    />
                                    <span className="truncate">
                                        {school.name}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
