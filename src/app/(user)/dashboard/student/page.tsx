import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signInUrl } from "~/lib/auth/redirect-utils";
import { getCurrentMembership } from "~/server/current-membership";
import { Button } from "~/components/ui/button";
import SettingsSection from "./settings";
import { api } from "~/trpc/server";
import InProgressProblems from "./in-progress";
import SubmittedProblems from "./submitted-problems";

export default async function DashboardPage() {
    const { session, membership } = await getCurrentMembership();
    const user = session?.user;
    const isAuthenticated = session !== null;
    if (!isAuthenticated) {
        redirect(signInUrl("/dashboard/student"));
    }

    if (user === undefined) {
        redirect(signInUrl("/dashboard/student"));
    }

    if (session?.user === undefined || session?.user === null) {
        return null;
    }

    void api.user.getMe.prefetch();

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
                    {!membership && (
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                            <p className="text-sm text-blue-900">
                                You&apos;re not in a school yet. Ask your
                                teacher for your school&apos;s join code to
                                appear on its leaderboards.
                            </p>
                            <Button asChild size="sm">
                                <Link href="/join">Join a school</Link>
                            </Button>
                        </div>
                    )}
                    <section>
                        <h2 className="mt-6 mb-4 text-lg font-semibold">
                            Settings
                        </h2>
                        <SettingsSection />
                    </section>
                    <InProgressProblems />
                    <SubmittedProblems />
                </div>
            )}
        </div>
    );
}
