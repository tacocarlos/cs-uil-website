import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ChevronLeft } from "lucide-react";
import { db } from "~/server/db";
import { submission as submissionTable } from "~/server/db/schema/submission";
import { user as userTable } from "~/server/db/schema/auth";
import { eq } from "drizzle-orm";
import { getProblemById } from "~/lib/api/lunaghs";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { CodeBlock } from "~/components/code-block";
import { OverrideForm } from "./override-form";

export default async function SubmissionDetailPage({
    params,
}: {
    params: Promise<{ submissionId: string }>;
}) {
    const { submissionId } = await params;

    const [row] = await db
        .select({
            id: submissionTable.id,
            problemId: submissionTable.problemId,
            userId: submissionTable.userId,
            timeSubmitted: submissionTable.timeSubmitted,
            attemptNumber: submissionTable.attemptNumber,
            points: submissionTable.points,
            maxPoints: submissionTable.maxPoints,
            accepted: submissionTable.accepted,
            submittedCode: submissionTable.submittedCode,
            isStudentVisible: submissionTable.isStudentVisible,
            userName: userTable.name,
            userEmail: userTable.email,
            userImage: userTable.image,
        })
        .from(submissionTable)
        .leftJoin(userTable, eq(submissionTable.userId, userTable.id))
        .where(eq(submissionTable.id, submissionId));

    if (!row) {
        notFound();
    }

    const apiResult = await getProblemById(row.problemId);
    const problemName = apiResult.problem?.name ?? `Problem #${row.problemId}`;

    return (
        <div className="min-h-screen bg-gray-50 px-8 pt-20 pb-8">
            <div className="mx-auto max-w-4xl">
                <Link
                    href="/dashboard/teacher"
                    className="text-muted-foreground flex items-center gap-1 text-sm hover:underline"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to dashboard
                </Link>

                <h1 className="mt-4 mb-6 text-2xl font-bold">
                    Submission Detail
                </h1>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Student card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Student</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm">
                            <p>
                                <span className="font-medium">Name: </span>
                                {row.userName ?? "Unknown"}
                            </p>
                            <p>
                                <span className="font-medium">Email: </span>
                                {row.userEmail ?? row.userId}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Problem card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Problem</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm">
                            <p>
                                <span className="font-medium">Name: </span>
                                {problemName}
                            </p>
                            <p>
                                <span className="font-medium">Submitted: </span>
                                {format(row.timeSubmitted, "PPPPpppp")}
                            </p>
                            <p>
                                <span>Attempt: </span>
                                {row.attemptNumber}
                            </p>
                            <p>
                                <span className="font-medium">Score: </span>
                                {row.points} / {row.maxPoints}
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="font-medium">Status: </span>
                                {row.accepted === true ? (
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                        Accepted
                                    </Badge>
                                ) : (
                                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                                        Rejected
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Code card */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Submitted Code</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CodeBlock code={row.submittedCode} />
                    </CardContent>
                </Card>

                {/* Override form */}
                <OverrideForm
                    submission={{
                        id: row.id,
                        accepted: row.accepted,
                        points: row.points,
                        maxPoints: row.maxPoints,
                        numAttempts: row.attemptNumber,
                    }}
                />
            </div>
        </div>
    );
}
