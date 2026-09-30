import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
import WrittenLeaderboard from "./written-leaderboard";

/**
 * Written test scores of the teacher's students, ranked. Teachers only (the
 * teacher layout checks); students don't have a written leaderboard.
 */
export default function WrittenLeaderboardPage() {
    return (
        <div className="min-h-screen bg-gray-50 px-8 pt-24 pb-8">
            <div className="mx-auto max-w-md">
                <Link
                    href="/dashboard/teacher"
                    className="text-muted-foreground flex items-center gap-1 text-sm hover:underline"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to dashboard
                </Link>
                <div className="mt-4 mb-6 flex items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold">Written test scores</h1>
                    <Button asChild size="sm">
                        <Link href="/dashboard/teacher/written">Add score</Link>
                    </Button>
                </div>
                <WrittenLeaderboard />
            </div>
        </div>
    );
}
