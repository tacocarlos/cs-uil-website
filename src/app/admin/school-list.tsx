"use client";

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { ClassificationForm } from "~/components/school/classification-form";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";
import { AddTeacherDialog } from "./add-teacher";
import { ManageSchoolDialog } from "./manage-school";

/**
 * Schools matching a name search, a page at a time (there could be one per
 * Texas high school), with each UIL classification editable in place.
 */
export function SchoolList() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const query = useDebouncedValue(search.trim());

    const utils = api.useUtils();
    const { data, isPending, isFetching } = api.school.search.useQuery(
        { query, page },
        // Keep showing the last results while the next ones load.
        { placeholderData: keepPreviousData },
    );
    const save = api.school.setClassification.useMutation({
        onSuccess: async (school) => {
            toast.success(`Saved ${school.name}`);
            await utils.school.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });

    const schools = data?.schools ?? [];
    const total = data?.total ?? 0;
    const pageSize = data?.pageSize ?? 25;
    const first = page * pageSize + 1;
    const last = page * pageSize + schools.length;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Schools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="relative max-w-sm">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                        type="search"
                        placeholder="Search schools by name"
                        aria-label="Search schools by name"
                        className="pl-9"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(0);
                        }}
                    />
                </div>

                {isPending ? (
                    <Skeleton className="h-24 w-full" />
                ) : schools.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                        {query
                            ? `No schools match "${query}".`
                            : "No schools yet."}
                    </p>
                ) : (
                    <>
                        <Table className={isFetching ? "opacity-60" : ""}>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>School</TableHead>
                                    <TableHead>UIL classification</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {schools.map((school) => (
                                    <TableRow key={school.id}>
                                        <TableCell className="font-medium">
                                            {school.name}
                                        </TableCell>
                                        <TableCell>
                                            <ClassificationForm
                                                // Remount when the saved values
                                                // change, so the form resets.
                                                key={`${school.conference}-${school.region}-${school.district}`}
                                                initial={school}
                                                onSave={(classification) =>
                                                    save.mutate({
                                                        organizationId:
                                                            school.id,
                                                        ...classification,
                                                    })
                                                }
                                                isSaving={
                                                    save.isPending &&
                                                    save.variables
                                                        ?.organizationId ===
                                                        school.id
                                                }
                                            />
                                        </TableCell>
                                        <TableCell className="space-x-1 text-right whitespace-nowrap">
                                            <AddTeacherDialog school={school} />
                                            <ManageSchoolDialog
                                                school={school}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                {first}–{last} of {total.toLocaleString()}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 0}
                                    onClick={() => setPage(page - 1)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={last >= total}
                                    onClick={() => setPage(page + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
