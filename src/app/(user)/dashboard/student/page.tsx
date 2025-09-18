import { auth } from "auth";
import { headers } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { User } from "~/server/db/schema/auth";
import { ProblemStatusCard } from "./ProblemStatusCard";
import { db } from "~/server/db";
import { problems } from "~/server/db/schema/problem";
import { eq } from "drizzle-orm";
import { submission as submissionTable } from "~/server/db/schema/submission";
import type { Problem } from "~/server/db/schema/types";
import { getUserRoles } from "~/lib/user/permission-utils";
import { Switch } from "~/components/ui/switch";
import SettingsSection from "./settings";
import { api } from "~/trpc/server";

async function RecentProblem({ user }: { user: User }) {
    if (user.mostRecentProblem === null) {
        return null;
    }

    const [problem] = await db
        .select()
        .from(problems)
        .where(eq(problems.id, user.mostRecentProblem))
        .limit(1);

    let [submission] = await db
        .select()
        .from(submissionTable)
        .where(eq(submissionTable.userId, user.id))
        .limit(1)
        .orderBy(submissionTable.timeSubmitted);

    return (
        <div>
            <ProblemStatusCard
                problem={problem as Problem}
                submission={submission}
            />
        </div>
    );
}

export default async function DashboardPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    const isAuthenticated = session !== null;
    if (!isAuthenticated) {
        redirect("/sign-in");
    }

    const user = await api.user.getUser({ userId: session!.user.id });
    if (user === undefined) {
        redirect("/sign-in");
    }

    const roles = await getUserRoles(user.id);

    if (session?.user === undefined || session?.user === null) {
        return null;
    }

    console.dir(session);

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

                    <div className="mt-4">
                        <h3 className="mb-2 font-medium">
                            Your CS UIL Progress
                        </h3>
                        <p className="text-gray-700">
                            Welcome to your dashboard! Here you can track your
                            progress and access competition resources.
                        </p>
                    </div>
                    <RecentProblem user={user} />
                    <section>
                        <h2 className="mt-6 mb-4 text-lg font-semibold">
                            Settings
                        </h2>
                        <SettingsSection
                            userId={user.id}
                            leaderboardVisibility={user.showScoresInLeaderboard}
                        />
                    </section>
                </div>
            )}
        </div>
    );
}
