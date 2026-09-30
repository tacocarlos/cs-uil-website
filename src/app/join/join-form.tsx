"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";

export function JoinForm({ initialCode }: { initialCode: string }) {
    const router = useRouter();
    const utils = api.useUtils();
    const [code, setCode] = useState(initialCode);

    const join = api.school.join.useMutation({
        onSuccess: async ({ name, alreadyMember }) => {
            toast.success(
                alreadyMember
                    ? `You're already in ${name}; switched to it.`
                    : `Joined ${name}!`,
            );
            // Everything school-specific changes with the active school.
            await utils.invalidate();
            router.push("/dashboard");
            router.refresh();
        },
        onError: (err) => toast.error(err.message),
    });

    return (
        <form
            className="space-y-4"
            onSubmit={(e) => {
                e.preventDefault();
                join.mutate({ code });
            }}
        >
            <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="XXXX-XXXX"
                aria-label="Join code"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                className="text-center font-mono text-lg tracking-widest uppercase"
                maxLength={20}
            />
            <Button
                type="submit"
                className="w-full"
                disabled={join.isPending || code.trim() === ""}
            >
                {join.isPending ? "Joining…" : "Join"}
            </Button>
        </form>
    );
}
