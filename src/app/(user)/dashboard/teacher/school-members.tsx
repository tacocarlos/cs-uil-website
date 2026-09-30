"use client";

import { format } from "date-fns";
import { Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import { formatJoinCode } from "~/lib/join-codes";
import { api } from "~/trpc/react";

const ROLE_LABELS: Record<string, string> = {
    owner: "Teacher (owner)",
    admin: "Teacher",
    member: "Student",
};

async function copy(text: string, what: string) {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copied`);
}

/** The school's join code and member list, for its teachers. */
export function SchoolMembersCard() {
    const utils = api.useUtils();
    const { data: school } = api.school.getMine.useQuery();
    const { data: members, isPending } = api.school.listMembers.useQuery();

    const regenerate = api.school.regenerateJoinCode.useMutation({
        onSuccess: async () => {
            toast.success("New join code created");
            await utils.school.getMine.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });
    const remove = api.school.removeMember.useMutation({
        onSuccess: async () => {
            toast.success("Student removed");
            await utils.school.listMembers.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });
    const setFormer = api.school.setFormer.useMutation({
        onSuccess: async (_, { former }) => {
            toast.success(
                former ? "Marked as a former student" : "Restored as current",
            );
            // Former students drop out of leaderboards and pickers.
            await utils.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });

    const code = school?.joinCode;
    const link =
        code && typeof window !== "undefined"
            ? `${window.location.origin}/join?code=${code}`
            : null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Students</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <section className="space-y-2">
                    <h3 className="font-medium">Join code</h3>
                    <p className="text-muted-foreground text-sm">
                        Students enter this code at /join, or open the link, to
                        join your school. Anyone with it can join, so make a new
                        one if it gets shared too widely; the old one then stops
                        working.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        {code ? (
                            <>
                                <code className="rounded bg-gray-100 px-3 py-1.5 font-mono text-lg tracking-widest">
                                    {formatJoinCode(code)}
                                </code>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        copy(formatJoinCode(code), "Code")
                                    }
                                >
                                    <Copy className="mr-1 h-4 w-4" /> Code
                                </Button>
                                {link && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copy(link, "Link")}
                                    >
                                        <Copy className="mr-1 h-4 w-4" /> Link
                                    </Button>
                                )}
                            </>
                        ) : (
                            <span className="text-muted-foreground text-sm">
                                No join code yet.
                            </span>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={regenerate.isPending}
                            onClick={() => {
                                if (
                                    !code ||
                                    confirm(
                                        "Make a new join code? The current one will stop working.",
                                    )
                                ) {
                                    regenerate.mutate();
                                }
                            }}
                        >
                            <RefreshCw className="mr-1 h-4 w-4" />
                            {code ? "New code" : "Create code"}
                        </Button>
                    </div>
                </section>

                <section className="space-y-2">
                    <h3 className="font-medium">
                        Members{members && ` (${members.length})`}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                        Mark students who graduate or leave as former: they drop
                        off the leaderboards, but their scores stay for your
                        written statistics and leaderboard (tick &ldquo;Include
                        former students&rdquo; there).
                    </p>
                    {isPending ? (
                        <Skeleton className="h-24 w-full" />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members?.map((m) => (
                                    <TableRow
                                        key={m.userId}
                                        className={
                                            m.formerAt
                                                ? "text-muted-foreground"
                                                : undefined
                                        }
                                    >
                                        <TableCell>{m.name}</TableCell>
                                        <TableCell>{m.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {m.formerAt
                                                    ? "Former student"
                                                    : (ROLE_LABELS[m.role] ??
                                                      m.role)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {format(m.joinedAt, "PP")}
                                        </TableCell>
                                        <TableCell className="space-x-1 text-right whitespace-nowrap">
                                            {m.role === "member" && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={
                                                        setFormer.isPending
                                                    }
                                                    title={
                                                        m.formerAt
                                                            ? `Former since ${format(m.formerAt, "PP")}`
                                                            : "Graduated or left: keeps their history but leaves them out of leaderboards"
                                                    }
                                                    onClick={() =>
                                                        setFormer.mutate({
                                                            userId: m.userId,
                                                            former: !m.formerAt,
                                                        })
                                                    }
                                                >
                                                    {m.formerAt
                                                        ? "Restore"
                                                        : "Mark former"}
                                                </Button>
                                            )}
                                            {m.role === "member" && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={remove.isPending}
                                                    onClick={() => {
                                                        if (
                                                            confirm(
                                                                `Remove ${m.name} from your school?`,
                                                            )
                                                        ) {
                                                            remove.mutate({
                                                                userId: m.userId,
                                                            });
                                                        }
                                                    }}
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </section>
            </CardContent>
        </Card>
    );
}
