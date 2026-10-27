import Link from "next/link";
import { cn } from "~/lib/utils";

const KINDS = [
    { path: "/leaderboard", label: "Programming" },
    { path: "/leaderboard/written", label: "Written" },
] as const;

/** Switches between the programming and written leaderboards. */
export function LeaderboardKindTabs({ path }: { path: string }) {
    return (
        <nav className="mb-3 flex rounded-lg bg-white/10 p-1">
            {KINDS.map((kind) => (
                <Link
                    key={kind.path}
                    href={kind.path}
                    className={cn(
                        "rounded-md px-4 py-1.5 text-sm font-semibold",
                        path === kind.path
                            ? "bg-white text-black"
                            : "text-white hover:bg-white/20",
                    )}
                >
                    {kind.label}
                </Link>
            ))}
        </nav>
    );
}
