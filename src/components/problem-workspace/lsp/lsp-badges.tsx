import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import type { LspStatus } from "./use-lsp";

export const LSP_FEATURES = "autocomplete, error checking, and hover docs";

/** Marks a language that has a language server. */
export function LspSupportedBadge() {
    return (
        <Badge
            variant="outline"
            title={`Supports ${LSP_FEATURES}`}
            className="border-success/40 bg-success/10 text-success px-1.5 text-[10px]"
        >
            LSP supported
        </Badge>
    );
}

const LSP_STATUS_DISPLAY: Record<
    LspStatus,
    { label: string; dotClassName: string }
> = {
    off: {
        label: "LSP off: sign in to enable, or the LSP server isn't configured",
        dotClassName: "border border-muted-foreground",
    },
    connecting: {
        label: "LSP starting… (Java can take a few seconds)",
        dotClassName: "animate-pulse bg-warning",
    },
    ready: {
        label: `LSP connected: ${LSP_FEATURES} on`,
        dotClassName: "bg-success",
    },
    paused: {
        label: "LSP paused while idle: resumes when you type or click into the editor",
        dotClassName: "border border-warning",
    },
    unavailable: {
        label: "LSP unavailable: syntax highlighting only",
        dotClassName: "bg-destructive",
    },
};

/** "LSP Status: ●" for the current language's connection. */
export function LspStatusBadge({ status }: { status: LspStatus }) {
    const { label, dotClassName } = LSP_STATUS_DISPLAY[status];
    return (
        <Badge
            variant="outline"
            role="status"
            title={label}
            aria-label={label}
            className="text-muted-foreground gap-1.5"
        >
            LSP Status:
            <span
                aria-hidden
                className={cn("h-2 w-2 shrink-0 rounded-full", dotClassName)}
            />
        </Badge>
    );
}
