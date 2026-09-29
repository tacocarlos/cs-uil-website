import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { desc, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { submission as submissionTable } from "~/server/db/schema/submission";
import { user as userTable } from "~/server/db/schema/auth";
import { getAllMinimalProblems } from "~/lib/api/lunaghs";
import { getCurrentMembership } from "~/server/current-membership";
import { inSchool } from "~/server/organizations";
import { RevalidateCacheButton } from "./revalidate-cache-button";
import { Judge0StatusCard } from "./judge0-status";
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

export const dynamic = "force-dynamic";

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TeacherDashboardPage() {
    // The layout already checked that this is a teacher of the active school.
    const { membership } = await getCurrentMembership();
    if (!membership) return null;

    const [submissions, apiProblems] = await Promise.all([
        db
            .select({
                id: submissionTable.id,
                problemId: submissionTable.problemId,
                userId: submissionTable.userId,
                timeSubmitted: submissionTable.timeSubmitted,
                points: submissionTable.points,
                maxPoints: submissionTable.maxPoints,
                accepted: submissionTable.accepted,
                userName: userTable.name,
                userEmail: userTable.email,
                attemptNum: submissionTable.attemptNumber,
            })
            .from(submissionTable)
            .leftJoin(userTable, eq(submissionTable.userId, userTable.id))
            .where(inSchool(submissionTable.userId, membership.organizationId))
            .orderBy(desc(submissionTable.timeSubmitted))
            .limit(10),
        getAllMinimalProblems(),
    ]);

    const problemNameMap = new Map(apiProblems.map((p) => [p.id, p.name]));

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
                </div>
            </div>

            {/* ── Judge0 status ──────────────────────────────────────────────── */}
            <div className="mb-8 max-w-sm">
                <Judge0StatusCard />
            </div>

            {/* ── Recent submissions ─────────────────────────────────────── */}
            <section>
                <h2 className="mb-4 text-lg font-semibold">
                    Recent Submissions
                </h2>

                {submissions.length === 0 ? (
                    <p className="text-muted-foreground py-12 text-center text-sm">
                        No submissions yet.
                    </p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Problem</TableHead>
                                <TableHead>Submitted</TableHead>
                                <TableHead>Attempt Number</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {submissions.map((s) => {
                                const studentLabel =
                                    s.userName ?? s.userEmail ?? s.userId;
                                const problemLabel =
                                    problemNameMap.get(s.problemId) ??
                                    `Problem #${s.problemId}`;

                                return (
                                    <TableRow key={s.id}>
                                        <TableCell>{studentLabel}</TableCell>
                                        <TableCell>{problemLabel}</TableCell>
                                        <TableCell>
                                            <span
                                                title={s.timeSubmitted.toISOString()}
                                            >
                                                {formatDistanceToNow(
                                                    s.timeSubmitted,
                                                    { addSuffix: true },
                                                )}
                                            </span>
                                        </TableCell>
                                        <TableCell>{s.attemptNum}</TableCell>
                                        <TableCell>
                                            {s.points} / {s.maxPoints}
                                        </TableCell>
                                        <TableCell>
                                            {s.accepted ? (
                                                <Badge className="bg-green-100 text-green-800">
                                                    Accepted
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-red-100 text-red-800">
                                                    Denied
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                            >
                                                <Link
                                                    href={`/dashboard/teacher/submissions/${s.id}`}
                                                >
                                                    View
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </section>
        </div>
    );
}
