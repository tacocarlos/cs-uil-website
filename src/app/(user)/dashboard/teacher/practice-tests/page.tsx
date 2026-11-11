import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
import { getCurrentMembership } from "~/server/current-membership";
import { isConnected, memberCourse } from "~/server/prairielearn/leaderboard";
import { PracticeTestSetup } from "./connection";

export const dynamic = "force-dynamic";

/**
 * Teachers connect their school's PrairieLearn course, then link its
 * students to site accounts so their practice-test results count on the
 * leaderboard. Teachers only (the teacher layout checks), of schools a
 * site admin has turned the feature on for.
 */
export default async function PracticeTestsPage() {
    const { session, membership } = await getCurrentMembership();
    const course = await memberCourse(
        session?.user.id,
        membership?.organizationId,
    );
    if (!course) redirect("/dashboard/teacher");

    return (
        <div className="min-h-screen px-4 pt-24 pb-8 sm:px-8">
            <div className="mx-auto max-w-3xl">
                <Link
                    href="/dashboard/teacher"
                    className="text-muted-foreground flex items-center gap-1 text-sm hover:underline"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to dashboard
                </Link>
                <div className="mt-4 mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">
                            PrairieLearn practice tests
                        </h1>
                        {course.name && (
                            <p className="text-muted-foreground text-sm">
                                {course.name}
                            </p>
                        )}
                    </div>
                    {isConnected(course) && (
                        <Button asChild variant="outline" size="sm">
                            <Link href="/leaderboard/practice">
                                View leaderboard
                            </Link>
                        </Button>
                    )}
                </div>
                <PracticeTestSetup />
            </div>
        </div>
    );
}
