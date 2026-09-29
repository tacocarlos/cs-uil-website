import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { signInUrl } from "~/lib/auth/redirect-utils";
import { getCurrentMembership } from "~/server/current-membership";
import { isSchoolTeacher } from "~/server/organizations";

/** Teacher pages are for owners and admins of the user's active school. */
export default async function TeacherLayout({
    children,
}: {
    children: ReactNode;
}) {
    const { session, membership } = await getCurrentMembership();

    const headersList = await headers();
    const pathname = headersList.get("x-pathname") ?? "/dashboard/teacher";

    if (!session) redirect(signInUrl(pathname));

    if (!isSchoolTeacher(membership)) {
        redirect("/dashboard/student");
    }

    return <div>{children}</div>;
}
