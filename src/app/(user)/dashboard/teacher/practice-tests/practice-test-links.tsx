"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
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
import {
    formatPracticeTime,
    isLtiUid,
} from "~/lib/prairielearn/practice-tests";
import { api } from "~/trpc/react";
import {
    StudentResultsDialog,
    type StudentResultsTarget,
} from "./student-results-dialog";

const UNLINKED = "unlinked";

/**
 * How results are being copied, a button to copy them now, and everyone
 * who has taken a practice test with the account their results count for.
 */
export function PracticeTestLinks() {
    const utils = api.useUtils();
    const { data: status } = api.prairielearn.getStatus.useQuery();
    const { data: users, isPending } = api.prairielearn.listUsers.useQuery();
    const { data: members } = api.school.listMembers.useQuery();
    const [search, setSearch] = useState("");
    const [viewing, setViewing] = useState<StudentResultsTarget | null>(null);
    // Kept after closing so the dialog doesn't empty while it fades out.
    const [viewingOpen, setViewingOpen] = useState(false);

    const sync = api.prairielearn.sync.useMutation({
        onSuccess: async () => {
            toast.success("Got the latest results from PrairieLearn");
            await utils.prairielearn.invalidate();
        },
        onError: async (err) => {
            toast.error(err.message);
            await utils.prairielearn.getStatus.invalidate();
        },
    });
    const setLink = api.prairielearn.setLink.useMutation({
        onSuccess: () => utils.prairielearn.listUsers.invalidate(),
        onError: (err) => toast.error(err.message),
    });

    // Current members can be linked; former ones only stay as they are.
    const choices = useMemo(
        () => (members ?? []).filter((m) => m.formerAt === null),
        [members],
    );
    const filtered = useMemo(() => {
        const term = search.toLowerCase();
        return (users ?? []).filter(
            (u) =>
                (u.name ?? "").toLowerCase().includes(term) ||
                u.uid.toLowerCase().includes(term) ||
                (u.linkedName ?? "").toLowerCase().includes(term),
        );
    }, [users, search]);
    const unlinked = users?.filter((u) => u.userId === null).length ?? 0;

    return (
        <div className="space-y-4">
            <div className="bg-card text-card-foreground flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 shadow-sm">
                <div className="text-sm">
                    <p>
                        {status?.syncedAt
                            ? `Results copied ${formatPracticeTime(status.syncedAt)}. They refresh on their own when the leaderboard is viewed.`
                            : "Results haven't been copied yet."}
                    </p>
                    {status?.syncError && (
                        <p className="text-destructive mt-1">
                            Last try failed: {status.syncError}
                        </p>
                    )}
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => sync.mutate()}
                    disabled={sync.isPending}
                >
                    <RefreshCw
                        className={sync.isPending ? "animate-spin" : undefined}
                    />
                    {sync.isPending ? "Refreshing…" : "Refresh now"}
                </Button>
            </div>

            <div className="bg-card text-card-foreground rounded-xl border p-4 shadow-sm">
                <h2 className="text-lg font-semibold">Students</h2>
                <p className="text-muted-foreground mb-4 text-sm">
                    Only students linked to an account in your school appear on
                    the leaderboard. Students who use PrairieLearn through the
                    LMS <em>and</em> with Google show up twice; link both to the
                    same account and their attempts count together.
                    {unlinked > 0 &&
                        ` ${unlinked} ${unlinked === 1 ? "isn't" : "aren't"} linked yet.`}
                </p>
                <Input
                    placeholder="Search by name or ID"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="mb-4"
                />
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>In PrairieLearn</TableHead>
                            <TableHead />
                            <TableHead className="text-right">
                                Attempts
                            </TableHead>
                            <TableHead className="w-60">Site account</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isPending ? (
                            <TableRow>
                                <TableCell colSpan={4}>
                                    <Skeleton className="h-8 w-full" />
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="h-24 text-center"
                                >
                                    {users?.length
                                        ? "No results found."
                                        : "No one has taken a practice test yet."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((u) => (
                                <TableRow key={u.prairielearnUserId}>
                                    <TableCell className="whitespace-normal">
                                        <div className="font-medium">
                                            {u.name ?? "Unnamed"}
                                        </div>
                                        <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                            {isLtiUid(u.uid) ? (
                                                <Badge variant="secondary">
                                                    LMS
                                                </Badge>
                                            ) : (
                                                <span className="break-all">
                                                    {u.uid}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {u.userId && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setViewing({
                                                        userId: u.userId!,
                                                        name:
                                                            u.linkedName ??
                                                            u.name ??
                                                            u.uid,
                                                    });
                                                    setViewingOpen(true);
                                                }}
                                            >
                                                View attempts
                                            </Button>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {u.attempts}
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={u.userId ?? UNLINKED}
                                            disabled={setLink.isPending}
                                            onValueChange={(value) =>
                                                setLink.mutate({
                                                    prairielearnUserId:
                                                        u.prairielearnUserId,
                                                    userId:
                                                        value === UNLINKED
                                                            ? null
                                                            : value,
                                                })
                                            }
                                        >
                                            <SelectTrigger
                                                className="w-full"
                                                aria-label={`Site account for ${u.name ?? u.uid}`}
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={UNLINKED}>
                                                    Not linked
                                                </SelectItem>
                                                {/* Keeps a link to someone
                                                    no longer a current member
                                                    showable. */}
                                                {u.userId &&
                                                    !choices.some(
                                                        (m) =>
                                                            m.userId ===
                                                            u.userId,
                                                    ) && (
                                                        <SelectItem
                                                            value={u.userId}
                                                        >
                                                            {u.linkedName ??
                                                                "Unknown account"}
                                                        </SelectItem>
                                                    )}
                                                {choices.map((m) => (
                                                    <SelectItem
                                                        key={m.userId}
                                                        value={m.userId}
                                                    >
                                                        {m.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {u.userId && !u.linkedByTeacher && (
                                            <p className="text-muted-foreground mt-1 text-xs">
                                                Linked by email
                                            </p>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <StudentResultsDialog
                student={viewing}
                open={viewingOpen}
                onOpenChange={setViewingOpen}
            />
        </div>
    );
}
