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
        <div className="grid gap-2 rounded-md border border-dashed border-amber-400 bg-amber-50 p-3">
            <p className="text-center text-xs font-medium text-amber-800">
                Development only
            </p>
            <div className="grid grid-cols-2 gap-2">
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
