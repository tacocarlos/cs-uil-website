import { redirect } from "next/navigation";
import { signInUrl } from "~/lib/auth/redirect-utils";
import { getCurrentMembership } from "~/server/current-membership";
import { isSchoolTeacher } from "~/server/organizations";

export default async function DashboardRedirect() {
    const { session, membership } = await getCurrentMembership();

    if (!session) {
        redirect(signInUrl("/dashboard"));
    }

    if (isSchoolTeacher(membership)) {
        redirect("/dashboard/teacher");
    }

    redirect("/dashboard/student");
}
