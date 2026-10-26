import { redirect } from "next/navigation";
import { signInUrl } from "~/lib/auth/redirect-utils";
import { getCurrentMembership } from "~/server/current-membership";
import { MyRequests } from "./my-requests";
import { RequestForm } from "./request-form";

/** Where signed-in users suggest features or report bugs. */
export default async function RequestPage() {
    const { session } = await getCurrentMembership();
    if (!session) redirect(signInUrl("/request"));

    return (
        <main className="min-h-screen bg-gray-50 px-4 pt-24 pb-12">
            <div className="mx-auto max-w-2xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Request a feature</h1>
                    <p className="text-muted-foreground text-sm">
                        Suggest something new or report a bug. We&apos;ll reply
                        here once we&apos;ve looked at it.
                    </p>
                </div>
                <RequestForm />
                <MyRequests />
            </div>
        </main>
    );
}
