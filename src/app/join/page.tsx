import { redirect } from "next/navigation";
import { signInUrl } from "~/lib/auth/redirect-utils";
import { getCurrentMembership } from "~/server/current-membership";
import { JoinForm } from "./join-form";

/**
 * Where students join a school with its code. Teachers can share
 * /join?code=XXXX-XXXX to fill the code in.
 */
export default async function JoinPage({
    searchParams,
}: {
    searchParams: Promise<{ code?: string | string[] }>;
}) {
    const { code } = await searchParams;
    const initialCode = typeof code === "string" ? code : "";

    const { session } = await getCurrentMembership();
    if (!session) {
        redirect(
            signInUrl(
                initialCode
                    ? `/join?code=${encodeURIComponent(initialCode)}`
                    : "/join",
            ),
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4 pt-24 pb-12">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-md">
                <h1 className="mb-2 text-2xl font-bold">Join your school</h1>
                <p className="text-muted-foreground mb-6 text-sm">
                    Enter the join code from your teacher.
                </p>
                <JoinForm initialCode={initialCode} />
            </div>
        </div>
    );
}
