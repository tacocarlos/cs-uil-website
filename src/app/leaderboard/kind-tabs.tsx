import Link from "next/link";
import { tabClass } from "./tab-class";

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
                    className={tabClass(
                        path === kind.path,
                        "px-4 py-1.5 font-semibold",
                    )}
                >
                    {kind.label}
                </Link>
            ))}
        </nav>
    );
}
