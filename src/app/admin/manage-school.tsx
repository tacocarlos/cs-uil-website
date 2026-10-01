"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";

const ROLE_OPTIONS = [
    { value: "owner", label: "Owner" },
    { value: "admin", label: "Teacher" },
    { value: "member", label: "Student" },
] as const;

/** Rename a school, manage its teachers, or delete it (site admins). */
export function ManageSchoolDialog({
    school,
}: {
    school: { id: string; name: string };
}) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    Manage
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{school.name}</DialogTitle>
                    <DialogDescription>
                        Students are managed by the school&apos;s teachers from
                        their dashboard.
                    </DialogDescription>
                </DialogHeader>
                {/* Mounted only while open, so data loads on demand. */}
                {open && (
                    <div className="space-y-6">
                        <RenameSchool school={school} />
                        <Separator />
                        <SchoolTeachers organizationId={school.id} />
                        <Separator />
                        <DeleteSchool
                            school={school}
                            onDeleted={() => setOpen(false)}
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function RenameSchool({ school }: { school: { id: string; name: string } }) {
    const utils = api.useUtils();
    const [name, setName] = useState(school.name);
    const rename = api.school.rename.useMutation({
        onSuccess: async (renamed) => {
            toast.success(`Renamed to ${renamed.name}`);
            await utils.school.search.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });

    return (
        <form
            className="space-y-2"
            onSubmit={(e) => {
                e.preventDefault();
                rename.mutate({ organizationId: school.id, name });
            }}
        >
            <h3 className="text-sm font-medium">Name</h3>
            <div className="flex gap-2">
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    aria-label="School name"
                    maxLength={100}
                />
                <Button
                    type="submit"
                    disabled={
                        rename.isPending ||
                        name.trim().length < 2 ||
                        name.trim() === school.name
                    }
                >
                    Rename
                </Button>
            </div>
        </form>
    );
}

function SchoolTeachers({ organizationId }: { organizationId: string }) {
    const utils = api.useUtils();
    const { data: teachers, isPending } = api.school.listTeachers.useQuery({
        organizationId,
    });
    const refresh = () => utils.school.listTeachers.invalidate();

    const setRole = api.school.setMemberRole.useMutation({
        onSuccess: async (_, { role }) => {
            toast.success(
                role === "member" ? "Changed to a student" : "Role updated",
            );
            await refresh();
        },
        onError: (err) => toast.error(err.message),
    });
    const remove = api.school.removeFromSchool.useMutation({
        onSuccess: async () => {
            toast.success("Removed from the school");
            await refresh();
        },
        onError: (err) => toast.error(err.message),
    });

    return (
        <section className="space-y-2">
            <h3 className="text-sm font-medium">Teachers</h3>
            {isPending ? (
                <Skeleton className="h-16 w-full" />
            ) : !teachers?.length ? (
                <p className="text-muted-foreground text-sm">
                    No teachers yet. Use &ldquo;Add teacher&rdquo; to add one.
                </p>
            ) : (
                <ul className="space-y-2">
                    {teachers.map((t) => (
                        <li
                            key={t.userId}
                            className="flex items-center justify-between gap-2"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                    {t.name}
                                </p>
                                <p className="text-muted-foreground truncate text-xs">
                                    {t.email}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                                <Select
                                    value={t.role}
                                    disabled={setRole.isPending}
                                    onValueChange={(role) =>
                                        setRole.mutate({
                                            organizationId,
                                            userId: t.userId,
                                            role: role as
                                                | "owner"
                                                | "admin"
                                                | "member",
                                        })
                                    }
                                >
                                    <SelectTrigger
                                        className="h-8 w-28"
                                        aria-label={`${t.name}'s role`}
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ROLE_OPTIONS.map((o) => (
                                            <SelectItem
                                                key={o.value}
                                                value={o.value}
                                            >
                                                {o.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={remove.isPending}
                                    onClick={() => {
                                        if (
                                            confirm(
                                                `Remove ${t.name} from this school?`,
                                            )
                                        ) {
                                            remove.mutate({
                                                organizationId,
                                                userId: t.userId,
                                            });
                                        }
                                    }}
                                >
                                    Remove
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

function DeleteSchool({
    school,
    onDeleted,
}: {
    school: { id: string; name: string };
    onDeleted: () => void;
}) {
    const utils = api.useUtils();
    const [confirmName, setConfirmName] = useState("");
    const del = api.school.delete.useMutation({
        onSuccess: async ({ name }) => {
            toast.success(`Deleted ${name}`);
            onDeleted();
            await utils.school.search.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });

    return (
        <section className="space-y-2">
            <h3 className="text-sm font-medium text-red-700">Delete school</h3>
            <p className="text-muted-foreground text-sm">
                Removes everyone from the school and deletes the contests it
                hosted, with their results. Students keep their accounts,
                practice submissions, and written scores. This can&apos;t be
                undone. Type the school&apos;s name to confirm.
            </p>
            <div className="flex gap-2">
                <Input
                    value={confirmName}
                    onChange={(e) => setConfirmName(e.target.value)}
                    placeholder={school.name}
                    aria-label="Type the school's name to confirm"
                />
                <Button
                    variant="destructive"
                    disabled={del.isPending || confirmName !== school.name}
                    onClick={() => del.mutate({ organizationId: school.id })}
                >
                    Delete
                </Button>
            </div>
        </section>
    );
}
