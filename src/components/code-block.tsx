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
                "overflow-x-auto rounded-md bg-slate-900 p-4 font-mono text-sm whitespace-pre-wrap text-slate-100",
                className,
            )}
        >
            {code}
        </pre>
    );
}
