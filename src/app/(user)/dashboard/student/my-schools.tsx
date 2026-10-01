"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

/** The user's schools, with a way to leave the ones they're a student at. */
export function MySchools() {
    const router = useRouter();
    const utils = api.useUtils();
    const { data: schools } = api.school.listMine.useQuery();
    const leave = api.school.leave.useMutation({
        onSuccess: async () => {
            toast.success("You left the school");
            // The active school may have changed.
            await utils.invalidate();
            router.refresh();
        },
        onError: (err) => toast.error(err.message),
    });

    if (!schools?.length) return null;

    return (
        <section>
            <h2 className="mt-6 mb-4 text-lg font-semibold">Your schools</h2>
            <ul className="space-y-2">
                {schools.map((s) => (
                    <li
                        key={s.id}
                        className="flex items-center justify-between gap-3 rounded-md border p-3"
                    >
                        <span className="flex items-center gap-2">
                            {s.name}
                            {s.role !== "member" ? (
                                <Badge variant="outline">Teacher</Badge>
                            ) : s.formerAt ? (
                                <Badge variant="outline">Former student</Badge>
                            ) : null}
                        </span>
                        {s.role === "member" && (
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={leave.isPending}
                                onClick={() => {
                                    if (
                                        confirm(
                                            `Leave ${s.name}? You'll need a join code to come back.`,
                                        )
                                    ) {
                                        leave.mutate({ organizationId: s.id });
                                    }
                                }}
                            >
                                Leave
                            </Button>
                        )}
                    </li>
                ))}
            </ul>
            <Button asChild variant="link" className="mt-2 px-0">
                <Link href="/join">Join another school</Link>
            </Button>
        </section>
    );
}
