import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { signInUrl } from "~/lib/auth/redirect-utils";
import { getCurrentMembership } from "~/server/current-membership";

/** Admin pages are for site admins (global role) only. */
export default async function AdminLayout({
    children,
}: {
    children: ReactNode;
}) {
    const { session } = await getCurrentMembership();
    if (!session) {
        const pathname = (await headers()).get("x-pathname") ?? "/admin";
        redirect(signInUrl(pathname));
    }
    if (session.user.role !== "site-admin") redirect("/dashboard");

    return <>{children}</>;
}
