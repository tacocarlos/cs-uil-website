import Link from "next/link";
import { type SchoolFilter } from "~/lib/schools";
import { type LeaderboardScope } from "~/server/organizations";
import { SchoolFilterControls } from "./school-filter";
import { tabClass } from "./tab-class";

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
    const tab = (active: boolean) => tabClass(active, "px-3 py-1 font-medium");

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
