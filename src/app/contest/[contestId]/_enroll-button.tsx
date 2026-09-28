"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";

/** Enrolls the signed-in user in the contest. */
export function EnrollButton({ contestId }: { contestId: number }) {
    const router = useRouter();
    const enroll = api.contest.enroll.useMutation({
        onSuccess: () => {
            toast.success("You're enrolled! Good luck.");
            router.refresh();
        },
        onError: (err) => toast.error(err.message),
    });

    return (
        <Button
            size="sm"
            onClick={() => enroll.mutate({ contestId })}
            disabled={enroll.isPending}
        >
            {enroll.isPending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enrolling…
                </>
            ) : (
                "Enroll in Contest"
            )}
        </Button>
    );
}
