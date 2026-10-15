"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

/** A school's ID in monospace, copied to the clipboard on click. */
export function SchoolId({ id }: { id: string }) {
    return (
        <button
            type="button"
            title="Copy school ID"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-mono text-xs"
            onClick={async () => {
                await navigator.clipboard.writeText(id);
                toast.success("School ID copied");
            }}
        >
            {id}
            <Copy className="h-3 w-3" />
        </button>
    );
}
