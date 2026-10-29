import { redirect } from "next/navigation";
import { requireSession } from "~/server/current-membership";
import { isSchoolTeacher } from "~/server/organizations";

export default async function DashboardRedirect() {
    const { membership } = await requireSession("/dashboard");

    if (isSchoolTeacher(membership)) {
        redirect("/dashboard/teacher");
    }

    redirect("/dashboard/student");
}
