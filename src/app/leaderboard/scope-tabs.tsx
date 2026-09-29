import Link from "next/link";
import { cn } from "~/lib/utils";
import { type LeaderboardScope } from "~/server/organizations";

/** Switches a leaderboard page between the viewer's school and everyone. */
export function LeaderboardScopeTabs({
    path,
    scope,
    hasSchool,
}: {
    path: string;
    scope: LeaderboardScope;
    hasSchool: boolean;
}) {
    const tab = (active: boolean) =>
        cn(
            "rounded-md px-3 py-1 text-sm font-medium",
            active ? "bg-white text-black" : "text-white hover:bg-white/20",
        );

    return (
        <div className="mb-4 flex flex-col items-center gap-1">
            <nav className="flex gap-2">
                {hasSchool && (
                    <Link href={path} className={tab(scope === "school")}>
                        My school
                    </Link>
                )}
                <Link
                    href={`${path}?view=global`}
                    className={tab(scope === "global")}
                >
                    All schools
                </Link>
            </nav>
            {scope === "global" && (
                <p className="text-xs text-white/80">
                    Only students who chose to share their scores with other
                    schools appear here.
                </p>
            )}
        </div>
    );
}
