"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";

/** Makes an existing account a teacher of the given school, by email. */
export function AddTeacherDialog({
    school,
}: {
    school: { id: string; name: string };
}) {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const add = api.school.addTeacher.useMutation({
        onSuccess: ({ teacher, school }) => {
            toast.success(`${teacher} is now a teacher at ${school}`);
            setEmail("");
            setOpen(false);
        },
        onError: (err) => toast.error(err.message),
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    Add teacher
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        add.mutate({ organizationId: school.id, email });
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>
                            Add a teacher to {school.name}
                        </DialogTitle>
                        <DialogDescription>
                            They need to have signed in to the site once. They
                            can then see the school&apos;s join code and
                            students from their teacher dashboard.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        type="email"
                        className="my-4"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="teacher@school.org"
                        aria-label="Teacher's email"
                    />
                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={add.isPending || email.trim() === ""}
                        >
                            {add.isPending ? "Adding…" : "Add teacher"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
