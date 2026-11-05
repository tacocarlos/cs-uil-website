"use client";

import { useState } from "react";
import { toast } from "sonner";
import { signIn } from "auth-client";
import { Button } from "~/components/ui/button";
import { DEV_ACCOUNTS, type DevAccountKind } from "~/lib/auth/dev-accounts";
import { prepareDevAccount } from "./dev-login-action";

/** One-click sign-in as a fake account. Only rendered in development. */
export function DevLoginButtons({ callbackURL }: { callbackURL: string }) {
    const [pending, setPending] = useState<DevAccountKind | null>(null);

    async function signInAs(kind: DevAccountKind) {
        setPending(kind);
        try {
            const credentials = await prepareDevAccount(kind);
            const { error } = await signIn.email({
                ...credentials,
                callbackURL,
            });
            if (error) throw new Error(error.message);
        } catch (error) {
            toast.error(`Dev sign-in failed: ${String(error)}`);
            setPending(null);
        }
    }

    return (
        <div className="border-warning/50 bg-warning/10 grid gap-2 rounded-md border border-dashed p-3">
            <p className="text-warning text-center text-xs font-medium">
                Development only
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(Object.keys(DEV_ACCOUNTS) as DevAccountKind[]).map((kind) => (
                    <Button
                        key={kind}
                        variant="outline"
                        disabled={pending !== null}
                        onClick={() => void signInAs(kind)}
                    >
                        {pending === kind
                            ? "Signing in…"
                            : `Sign in as ${DEV_ACCOUNTS[kind].name}`}
                    </Button>
                ))}
            </div>
        </div>
    );
}
