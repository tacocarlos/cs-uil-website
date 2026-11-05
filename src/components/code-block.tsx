import { cn } from "~/lib/utils";

/** Read-only source code, shown verbatim (never parsed as Markdown). */
export function CodeBlock({
    code,
    className,
}: {
    code: string;
    className?: string;
}) {
    return (
        <pre
            className={cn(
                "bg-muted text-foreground overflow-x-auto rounded-md border p-4 font-mono text-sm whitespace-pre-wrap",
                className,
            )}
        >
            {code}
        </pre>
    );
}
