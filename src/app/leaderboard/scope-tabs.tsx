import Link from "next/link";
import { type SchoolFilter } from "~/lib/schools";
import { cn } from "~/lib/utils";
import { type LeaderboardScope } from "~/server/organizations";
import { SchoolFilterControls } from "./school-filter";

/**
 * Switches a leaderboard page between the viewer's school and everyone,
 * with conference/region/district filters for the latter.
 */
export function LeaderboardScopeTabs({
    path,
    scope,
    filter,
    hasSchool,
}: {
    path: string;
    scope: LeaderboardScope;
    filter: SchoolFilter;
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
                <>
                    <p className="mb-2 text-xs text-white/80">
                        Only students who chose to share their scores with other
                        schools appear here.
                    </p>
                    <SchoolFilterControls filter={filter} />
                </>
            )}
        </div>
    );
}
