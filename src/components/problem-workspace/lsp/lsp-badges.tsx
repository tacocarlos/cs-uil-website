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
            className="border-green-600/40 bg-green-50 px-1.5 text-[10px] text-green-700"
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
        dotClassName: "border border-slate-400",
    },
    connecting: {
        label: "LSP starting… (Java can take a few seconds)",
        dotClassName: "animate-pulse bg-amber-400",
    },
    ready: {
        label: `LSP connected: ${LSP_FEATURES} on`,
        dotClassName: "bg-green-500",
    },
    paused: {
        label: "LSP paused while idle: resumes when you type or click into the editor",
        dotClassName: "border border-amber-400",
    },
    unavailable: {
        label: "LSP unavailable: syntax highlighting only",
        dotClassName: "bg-red-500",
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
            className="gap-1.5 border-slate-600 text-slate-300"
        >
            LSP Status:
            <span
                aria-hidden
                className={cn("h-2 w-2 shrink-0 rounded-full", dotClassName)}
            />
        </Badge>
    );
}
