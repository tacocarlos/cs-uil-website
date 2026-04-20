import { auth } from "auth";
import { headers } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { User } from "~/server/db/schema/auth";
import { ProblemStatusCard } from "./ProblemStatusCard";
import type { Problem } from "~/server/db/schema/types";
import SettingsSection from "./settings";
import { api } from "~/trpc/server";
import { Skeleton } from "~/components/ui/skeleton";
import InProgressProblems from "./in-progress";
import SubmittedProblems from "./submitted-problems";
import {
    getProblemById,
    getAllCompetitions,
    toAppProblem,
} from "~/lib/api/lunaghs";

async function RecentProblem({ userId }: { userId: string }) {
    const user = await api.user.getUser({ userId });

    if (user === undefined) {
        return <Skeleton />;
    }

    if (user.mostRecentProblem === null) {
        return null;
    }

    const [apiResult, competitions] = await Promise.all([
        getProblemById(user.mostRecentProblem),
        getAllCompetitions(),
    ]);

    if (!apiResult.success || !apiResult.problem) {
        return null;
    }

    const apiProblem = apiResult.problem;
    const competition = competitions.find(
        (c) => c.id === apiProblem.competition,
    );

    if (!competition) {
        return null;
    }

    const problem = (await toAppProblem(apiProblem, competition)) as Problem;

    const mrsResult = await api.submission.getMostRecentSubmission({
        userId,
        problemId: problem.id,
    });

    const submission =
        mrsResult?.state === "success" ? mrsResult.mostRecent : undefined;

    return (
        <div>
            <p>Points: </p>
            <ProblemStatusCard problem={problem} submission={submission} />
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
