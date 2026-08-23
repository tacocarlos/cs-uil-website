import { auth } from "auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { signInUrl } from "~/lib/auth/redirect-utils";

/**
 * Auth guard for all /contest/* routes.
 *
 * Reads the current pathname from the `x-pathname` request header (set by
 * middleware) so the sign-in page can redirect back after login.
 */
export default async function ContestLayout({
    children,
}: {
    children: ReactNode;
}) {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
        const pathname =
            headersList.get("x-pathname") ?? "/contest";
        redirect(signInUrl(pathname));
    }

    return <>{children}</>;
}
