import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "~/server/db";
import { submission as submissionTable } from "~/server/db/schema/submission";
import { user as userTable } from "~/server/db/schema/auth";
import { member as memberTable } from "~/server/db/schema/organization";
import { getAllMinimalProblems } from "~/lib/api/lunaghs";
import { getCurrentMembership } from "~/server/current-membership";
import { inSchool } from "~/server/organizations";
import { RevalidateCacheButton } from "./revalidate-cache-button";
import { Judge0StatusCard } from "./judge0-status";
import { SchoolClassificationCard } from "./school-classification";
import { SchoolMembersCard } from "./school-members";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import { submissionRouter } from "~/server/api/routers/submission";
import { api } from "~/trpc/server";
import { RecentOrgSubmissions } from "./recent-submissions";

export const dynamic = "force-dynamic";

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function TeacherDashboardPage() {
    // The layout already checked that this is a teacher of the active school.
    const { membership } = await getCurrentMembership();
    if (!membership) return null;

    return (
        <div className="min-h-screen bg-gray-50 p-8 p-20">
            <div className="mb-8 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
                <div className="flex items-center gap-3">
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
            </div>

            {/* ── Recent submissions ─────────────────────────────────────── */}
            <section>
                <RecentOrgSubmissions/>
            </section>

            {/* ── Join code and members ─────────────────────────────────── */}
            <section className="mt-8">
                <SchoolMembersCard />
            </section>
        </div>
    );
}
