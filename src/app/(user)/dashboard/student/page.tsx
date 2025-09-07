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
import { ro } from "date-fns/locale";

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
    const user = session?.user as User;
    if (!isAuthenticated) {
        redirect("/sign-in");
    }

    const roles = await getUserRoles(user.id);

    
    return (
        <div className="bg-primary container min-h-screen py-8">
            <h1 className="mb-4 text-2xl font-bold">Dashboard</h1>
            {user && (
                <div className="rounded-lg bg-white p-6 shadow-md">
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
                </div>
            )}
        </div>
    );
}
