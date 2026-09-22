"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { invalidateProblemCache } from "./actions";

export function RevalidateCacheButton() {
    const [pending, setPending] = useState(false);

    async function handleClick() {
        setPending(true);
        try {
            await invalidateProblemCache();
            toast.success(
                "Problem cache invalidated — fresh data will load on the next request.",
            );
        } catch {
            toast.error("Failed to invalidate cache.");
        } finally {
            setPending(false);
        }
    }

    return (
        <Button variant="outline" disabled={pending} onClick={handleClick}>
            <RefreshCw
                className={`mr-2 h-4 w-4 ${pending ? "animate-spin" : ""}`}
            />
            {pending ? "Refreshing…" : "Refresh Problem Data"}
        </Button>
    );
}
