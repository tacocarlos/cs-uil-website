"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useSession } from "auth-client";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import { BAN_DURATIONS, isBanActive, MAX_BAN_SECONDS } from "~/lib/auth/bans";
import { isTeacherRole, MEMBER_ROLE_LABELS } from "~/lib/auth/organizations";
import { isSiteAdmin } from "~/lib/auth/roles";
import { api } from "~/trpc/react";
import type { ListedUser } from "./user-list";

const DATE_TIME = "MMM d, yyyy 'at' h:mm a";

/** Site admin, and teacher/student if they are one in any school. */
export function RoleBadges({ user }: { user: ListedUser }) {
    const teaches = user.schools.some((s) => isTeacherRole(s.role));
    const studies = user.schools.some((s) => s.role === "member");
    return (
        <div className="flex flex-wrap gap-1">
            {isSiteAdmin(user.role) && <Badge>Site admin</Badge>}
            {teaches && <Badge variant="secondary">Teacher</Badge>}
            {studies && <Badge variant="outline">Student</Badge>}
            {!isSiteAdmin(user.role) && !teaches && !studies && (
                <span className="text-muted-foreground text-sm">—</span>
            )}
        </div>
    );
}

/** "Active", or "Banned" with when the ban ends. */
export function BanStatus({ user }: { user: ListedUser }) {
    if (!isBanActive(user)) {
        return <span className="text-muted-foreground text-sm">Active</span>;
    }
    return (
        <div>
            <Badge variant="destructive">Banned</Badge>
            <div className="text-muted-foreground mt-0.5 text-xs whitespace-nowrap">
                {user.banExpires
                    ? `until ${format(user.banExpires, "MMM d, h:mm a")}`
                    : "permanently"}
            </div>
        </div>
    );
}

/** A user's details, with a form to ban them or lift their ban. */
export function UserDialog({
    user,
    open,
    onOpenChange,
}: {
    user: ListedUser;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { data: session } = useSession();
    const isSelf = session?.user.id === user.id;
    const banned = isBanActive(user);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{user.name}</DialogTitle>
                    <DialogDescription>{user.email}</DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                    <section className="space-y-3 text-sm">
                        <RoleBadges user={user} />
                        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                            <dt className="text-muted-foreground">Joined</dt>
                            <dd>{format(user.createdAt, DATE_TIME)}</dd>
                            <dt className="text-muted-foreground">User ID</dt>
                            <dd className="font-mono text-xs leading-5 break-all">
                                {user.id}
                            </dd>
                        </dl>
                        <div>
                            <h3 className="mb-1 font-medium">Schools</h3>
                            {user.schools.length ? (
                                <ul className="space-y-1">
                                    {user.schools.map((s) => (
                                        <li
                                            key={s.id}
                                            className="flex justify-between gap-2"
                                        >
                                            <span className="truncate">
                                                {s.name}
                                            </span>
                                            <span className="text-muted-foreground shrink-0">
                                                {MEMBER_ROLE_LABELS[s.role]}
                                                {s.formerAt && " (former)"}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted-foreground">
                                    Not in any school.
                                </p>
                            )}
                        </div>
                    </section>
                    <Separator />
                    {isSelf ? (
                        <p className="text-muted-foreground text-sm">
                            You can&apos;t ban your own account.
                        </p>
                    ) : (
                        <>
                            {banned && <CurrentBan user={user} />}
                            {/* Remount after each ban so the form resets. */}
                            <BanForm
                                key={`${user.id}-${String(user.banExpires)}-${user.banned}`}
                                user={user}
                                replacing={banned}
                            />
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function CurrentBan({ user }: { user: ListedUser }) {
    const utils = api.useUtils();
    const unban = api.admin.unbanUser.useMutation({
        onSuccess: async ({ name }) => {
            toast.success(`Lifted ${name}'s ban`);
            await utils.admin.listUsers.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });

    return (
        <section className="border-destructive/40 bg-destructive/5 space-y-2 rounded-md border p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h3 className="text-destructive font-medium">Banned</h3>
                    <p className="text-muted-foreground">
                        {user.banExpires
                            ? `Until ${format(user.banExpires, DATE_TIME)} (${formatDistanceToNow(user.banExpires, { addSuffix: true })})`
                            : "Until lifted"}
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={unban.isPending}
                    onClick={() => unban.mutate({ userId: user.id })}
                >
                    {unban.isPending ? "Lifting…" : "Lift ban"}
                </Button>
            </div>
            {user.banReason && (
                <p>
                    <span className="text-muted-foreground">Reason: </span>
                    {user.banReason}
                </p>
            )}
        </section>
    );
}

type DurationChoice =
    | (typeof BAN_DURATIONS)[number]["id"]
    | "until"
    | "forever";

/** `datetime-local` value for a date, in local time. */
function toLocalInput(date: Date): string {
    return format(date, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Bans the user for a preset length, until a chosen time, or until lifted.
 * For a user who is already banned, this replaces their ban.
 */
function BanForm({
    user,
    replacing,
}: {
    user: ListedUser;
    replacing: boolean;
}) {
    const utils = api.useUtils();
    const [duration, setDuration] = useState<DurationChoice>("1d");
    const [until, setUntil] = useState(() =>
        toLocalInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    );
    const [reason, setReason] = useState(user.banReason ?? "");

    const ban = api.admin.banUser.useMutation({
        onSuccess: async ({ name }) => {
            toast.success(
                replacing ? `Updated ${name}'s ban` : `Banned ${name}`,
            );
            await utils.admin.listUsers.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });

    // Seconds until the ban ends; null for no end, NaN when invalid.
    let seconds: number | null;
    if (duration === "forever") seconds = null;
    else if (duration === "until") {
        seconds = Math.round((new Date(until).getTime() - Date.now()) / 1000);
    } else {
        seconds = BAN_DURATIONS.find((d) => d.id === duration)!.seconds;
    }
    const untilError =
        duration !== "until" || seconds === null
            ? null
            : Number.isNaN(seconds) || seconds < 60
              ? "Pick a time in the future."
              : seconds > MAX_BAN_SECONDS
                ? "Pick a time within a year, or ban until lifted."
                : null;

    return (
        <form
            className="space-y-3"
            onSubmit={(e) => {
                e.preventDefault();
                if (untilError) return;
                ban.mutate({
                    userId: user.id,
                    reason: reason.trim() || undefined,
                    expiresInSeconds: seconds,
                });
            }}
        >
            <div>
                <h3 className="text-sm font-medium">
                    {replacing ? "Change ban" : "Ban user"}
                </h3>
                <p className="text-muted-foreground text-sm">
                    {replacing
                        ? "Replaces the current ban."
                        : "Signs them out everywhere and stops them signing in until the ban ends."}
                </p>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="ban-duration">Length</Label>
                <Select
                    value={duration}
                    onValueChange={(v) => setDuration(v as DurationChoice)}
                >
                    <SelectTrigger id="ban-duration" className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {BAN_DURATIONS.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                                {d.label}
                            </SelectItem>
                        ))}
                        <SelectItem value="until">Until a date…</SelectItem>
                        <SelectItem value="forever">Until lifted</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {duration === "until" && (
                <div className="space-y-1.5">
                    <Label htmlFor="ban-until">Ends</Label>
                    <Input
                        id="ban-until"
                        type="datetime-local"
                        value={until}
                        min={toLocalInput(new Date())}
                        onChange={(e) => setUntil(e.target.value)}
                        aria-invalid={!!untilError}
                    />
                    {untilError && (
                        <p className="text-destructive text-sm">{untilError}</p>
                    )}
                </div>
            )}
            <div className="space-y-1.5">
                <Label htmlFor="ban-reason">Reason (optional)</Label>
                <Textarea
                    id="ban-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={500}
                    placeholder="Shown to other site admins"
                />
            </div>
            <div className="flex justify-end">
                <Button
                    type="submit"
                    variant="destructive"
                    disabled={ban.isPending || !!untilError}
                >
                    {ban.isPending
                        ? "Saving…"
                        : replacing
                          ? "Update ban"
                          : "Ban user"}
                </Button>
            </div>
        </form>
    );
}
