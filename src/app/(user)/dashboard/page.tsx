import { auth } from "auth";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signInUrl } from "~/lib/auth/redirect-utils";
import { db } from "~/server/db";
import { user, type User } from "~/server/db/schema/auth";
import { roles, userRoles } from "~/server/db/schema/role";

export default async function DashboardRedirect() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect(signInUrl("/dashboard"));
    }

    const currentUser = session.user as User;
    const isTeacherRole = currentUser.role !== "student";

    if (isTeacherRole) {
        redirect("/dashboard/teacher");
    }

    redirect("/dashboard/student");
}
