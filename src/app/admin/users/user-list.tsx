"use client";

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import { api, type RouterOutputs } from "~/trpc/react";
import { SchoolFilter, type SchoolOption } from "./school-filter";
import { BanStatus, RoleBadges, UserDialog } from "./user-dialog";

export type ListedUser = RouterOutputs["admin"]["listUsers"]["users"][number];

type RoleFilter = "site-admin" | "teacher" | "student" | "none";

const ROLE_FILTER_LABELS: Record<RoleFilter, string> = {
    "site-admin": "Site admins",
    teacher: "Teachers",
    student: "Students",
    none: "In no school",
};

/**
 * Every user, a page at a time, searchable by name or email and filtered
 * by role and school. Clicking a user opens their details and ban form.
 */
export function UserList() {
    const [search, setSearch] = useState("");
    const [role, setRole] = useState<RoleFilter | null>(null);
    const [school, setSchool] = useState<SchoolOption | null>(null);
    const [page, setPage] = useState(0);
    const query = useDebouncedValue(search.trim());
    // Kept after closing so the dialog keeps its content while it animates
    // out.
    const [selected, setSelected] = useState<ListedUser | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const { data, isPending, isFetching } = api.admin.listUsers.useQuery(
        { query, role, organizationId: school?.id ?? null, page },
        // Keep showing the last results while the next ones load.
        { placeholderData: keepPreviousData },
    );

    const users = data?.users ?? [];
    const total = data?.total ?? 0;
    const pageSize = data?.pageSize ?? 25;
    const first = page * pageSize + 1;
    const last = page * pageSize + users.length;
    // The selected user as of the latest fetch, so the dialog reflects a
    // ban or unban as soon as the list refreshes.
    const current = users.find((u) => u.id === selected?.id) ?? selected;

    const filtered = query || role || school;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    <div className="relative w-full max-w-sm">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            type="search"
                            placeholder="Search by name or email"
                            aria-label="Search users by name or email"
                            className="pl-9"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(0);
                            }}
                        />
                    </div>
                    <Select
                        value={role ?? "all"}
                        onValueChange={(value) => {
                            setRole(
                                value === "all" ? null : (value as RoleFilter),
                            );
                            setPage(0);
                        }}
                    >
                        <SelectTrigger
                            className="w-40"
                            aria-label="Filter by role"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All roles</SelectItem>
                            {(
                                Object.keys(ROLE_FILTER_LABELS) as RoleFilter[]
                            ).map((r) => (
                                <SelectItem key={r} value={r}>
                                    {ROLE_FILTER_LABELS[r]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <SchoolFilter
                        value={school}
                        onChange={(s) => {
                            setSchool(s);
                            setPage(0);
                        }}
                    />
                </div>
                {role === "none" && school && (
                    <p className="text-muted-foreground text-sm">
                        Users in no school can&apos;t also be in {school.name},
                        so nobody matches. Clear one of the filters.
                    </p>
                )}

                {isPending ? (
                    <Skeleton className="h-24 w-full" />
                ) : users.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                        {filtered
                            ? "No users match these filters."
                            : "No users yet."}
                    </p>
                ) : (
                    <>
                        <Table className={isFetching ? "opacity-60" : ""}>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Schools</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((u) => (
                                    <TableRow
                                        key={u.id}
                                        className="cursor-pointer"
                                        tabIndex={0}
                                        onClick={() => {
                                            setSelected(u);
                                            setDialogOpen(true);
                                        }}
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "Enter" ||
                                                e.key === " "
                                            ) {
                                                e.preventDefault();
                                                setSelected(u);
                                                setDialogOpen(true);
                                            }
                                        }}
                                    >
                                        <TableCell>
                                            <div className="font-medium">
                                                {u.name}
                                            </div>
                                            <div className="text-muted-foreground text-xs">
                                                {u.email}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <RoleBadges user={u} />
                                        </TableCell>
                                        <TableCell className="max-w-64 whitespace-normal">
                                            {u.schools.length ? (
                                                u.schools
                                                    .map((s) => s.name)
                                                    .join(", ")
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {format(u.createdAt, "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            <BanStatus user={u} />
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
            {current && (
                <UserDialog
                    user={current}
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                />
            )}
        </Card>
    );
}
