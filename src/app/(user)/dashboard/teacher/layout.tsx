import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { isSiteAdmin } from "~/lib/auth/roles";
import { currentPathname, requireSession } from "~/server/current-membership";
import { isSchoolTeacher } from "~/server/organizations";

/**
 * Teacher pages are for owners and admins of the user's active school. The
 * contest pages are also open to site admins, who manage every contest
 * whether or not they teach at a school.
 */
export default async function TeacherLayout({
    children,
}: {
    children: ReactNode;
}) {
    const { session, membership } = await requireSession("/dashboard/teacher");

    const pathname = await currentPathname("/dashboard/teacher");
    const siteAdminOnContests =
        isSiteAdmin(session.user.role) &&
        pathname.startsWith("/dashboard/teacher/contests");
    if (!isSchoolTeacher(membership) && !siteAdminOnContests) {
        redirect("/dashboard/student");
    }

    return <div>{children}</div>;
}
