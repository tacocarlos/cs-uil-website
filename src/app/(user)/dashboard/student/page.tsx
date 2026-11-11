import Image from "next/image";
import Link from "next/link";
import { accountLabel } from "~/lib/auth/usernames";
import { requireSession } from "~/server/current-membership";
import { Button } from "~/components/ui/button";
import SettingsSection from "./settings";
import { MySchools } from "./my-schools";
import { api } from "~/trpc/server";
import InProgressProblems from "./in-progress";
import SubmittedProblems from "./submitted-problems";
import Footer from "~/components/global/Footer";

export default async function DashboardPage() {
    const { session, membership } = await requireSession("/dashboard/student");
    const user = session.user;

    void api.user.getMe.prefetch();

    return (
        <>
            <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                {user && (
                    <div className="bg-card text-card-foreground w-screen rounded-lg border p-6 shadow-md">
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
                                <p className="text-muted-foreground">
                                    {accountLabel(user)}
                                </p>
                            </div>
                        </div>
                        {!membership && (
                            <div className="border-info/30 bg-info/10 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                                <p className="text-sm">
                                    You&apos;re not in a school yet. Ask your
                                    teacher for your school&apos;s join code to
                                    appear on its leaderboards.
                                </p>
                                <Button asChild size="sm">
                                    <Link href="/join">Join a school</Link>
                                </Button>
                            </div>
                        )}
                        <MySchools />
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
            <Footer />
        </>
    );
}
