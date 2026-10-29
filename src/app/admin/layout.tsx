import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { isSiteAdmin } from "~/lib/auth/roles";
import { requireSession } from "~/server/current-membership";

/** Admin pages are for site admins (global role) only. */
export default async function AdminLayout({
    children,
}: {
    children: ReactNode;
}) {
    const { session } = await requireSession("/admin");
    if (!isSiteAdmin(session.user.role)) redirect("/dashboard");

    return <>{children}</>;
}
