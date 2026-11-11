import Link from "next/link";
import { tabClass } from "./tab-class";

const KINDS = [
    { path: "/leaderboard", label: "Programming" },
    { path: "/leaderboard/written", label: "Written" },
] as const;

/** Only for schools linked to a PrairieLearn course. */
const PRACTICE = { path: "/leaderboard/practice", label: "Practice tests" };

/**
 * Switches between the programming and written leaderboards, and the
 * practice-test one when the viewer's school has it.
 */
export function LeaderboardKindTabs({
    path,
    showPractice = false,
}: {
    path: string;
    showPractice?: boolean;
}) {
    const kinds = showPractice ? [...KINDS, PRACTICE] : KINDS;
    return (
        <nav className="bg-muted mb-3 flex rounded-lg p-1">
            {kinds.map((kind) => (
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
