import { auth } from "auth";
import { headers } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { User } from "~/server/db/schema/auth";
import { ProblemStatusCard } from "./ProblemStatusCard";
import { db } from "~/server/db";
import { problems } from "~/server/db/schema/problem";
import { and, eq } from "drizzle-orm";
import { submission as submissionTable } from "~/server/db/schema/submission";
import type { Problem } from "~/server/db/schema/types";
import { getUserRoles } from "~/lib/user/permission-utils";
import { Switch } from "~/components/ui/switch";
import SettingsSection from "./settings";
import { api } from "~/trpc/server";
import { Skeleton } from "~/components/ui/skeleton";
import InProgressProblems from "./in-progress";
import SubmittedProblems from "./submitted-problems";

async function RecentProblem({ userId }: { userId: string }) {
    const user = await api.user.getUser({ userId });

    if (user === undefined) {
        return <Skeleton />;
    }

    if (user.mostRecentProblem === null) {
        return null;
    }

    const [problem] = await db
        .select()
        .from(problems)
        .where(eq(problems.id, user.mostRecentProblem))
        .limit(1);

    const mrsResult = await api.submission.getMostRecentSubmission({
        userId,
        problemId: problem!.id,
    });

    const submission =
        mrsResult?.state === "success" ? mrsResult.mostRecent : undefined;

    return (
        <div>
            <p>Points: </p>
            <ProblemStatusCard
                problem={problem as Problem}
                submission={submission}
            />
        </div>
    );
}

export default async function DashboardPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    const isAuthenticated = session !== null;
    if (!isAuthenticated) {
        redirect("/sign-in");
    }

    if (user === undefined) {
        redirect("/sign-in");
    }

    if (session?.user === undefined || session?.user === null) {
        return null;
    }

    api.user.getUser.prefetch({ userId: session!.user.id });

    return (
        <div className="bg-primary flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
            {user && (
                <div className="w-screen rounded-lg bg-white p-6 shadow-md">
                    <div className="mb-6 flex items-center gap-4">
                        {user.image && (
                            <Image
                                src={user.image}
                                alt={user.name || "User"}
                                width={250}
                                height={250}
                                className="h-16 w-16 rounded-full"
                            />
                        )}
                        <div>
                            <h2 className="text-xl font-semibold">
                                {user.name}
                            </h2>
                            <p className="text-gray-600">{user.email}</p>
                        </div>
                    </div>
                    <RecentProblem userId={user.id} />
                    <section>
                        <h2 className="mt-6 mb-4 text-lg font-semibold">
                            Settings
                        </h2>
                        <SettingsSection userId={user.id} />
                    </section>
                    <InProgressProblems userId={user.id} />
                    <SubmittedProblems userId={user.id} />
                </div>
            )}
        </div>
    );
}
