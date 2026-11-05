import Link from "next/link";
import { getCurrentMembership } from "~/server/current-membership";
import { RevalidateCacheButton } from "./revalidate-cache-button";
import { Judge0StatusCard } from "./judge0-status";
import { SchoolClassificationCard } from "./school-classification";
import { SchoolMembersCard } from "./school-members";
import { ExportDataCard } from "./export-data";
import { Button } from "~/components/ui/button";
import { RecentOrgSubmissions } from "./recent-submissions";

export const dynamic = "force-dynamic";

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function TeacherDashboardPage() {
    // The layout already checked that this is a teacher of the active school.
    const { membership } = await getCurrentMembership();
    if (!membership) return null;

    return (
        <div className="min-h-screen px-4 pt-20 pb-8 sm:px-8">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
                <div className="flex flex-wrap items-center gap-3">
                    <Button asChild>
                        <Link href="/dashboard/teacher/contests">
                            View Contest Page
                        </Link>
                    </Button>
                    <RevalidateCacheButton />
                    <Button asChild>
                        <Link href="/dashboard/teacher/written">
                            Add Written Test Score
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/dashboard/teacher/written/leaderboard">
                            Written Test Scores
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/dashboard/teacher/written/statistics">
                            Written Statistics
                        </Link>
                    </Button>
                </div>
            </div>

            {/* ── Judge0 status and school ──────────────────────────────────── */}
            <div className="mb-8 flex flex-wrap items-start gap-4">
                <div className="w-full max-w-sm">
                    <Judge0StatusCard />
                </div>
                <SchoolClassificationCard />
                <ExportDataCard />
            </div>

            {/* ── Recent submissions ─────────────────────────────────────── */}
            <section>
                <RecentOrgSubmissions />
            </section>

            {/* ── Join code and members ─────────────────────────────────── */}
            <section className="mt-8">
                <SchoolMembersCard />
            </section>
        </div>
    );
}
