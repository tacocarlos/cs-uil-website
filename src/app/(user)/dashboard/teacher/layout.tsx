import { auth } from "auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { signInUrl } from "~/lib/auth/redirect-utils";
import { isTeacher } from "~/lib/auth/roles";

export default async function TeacherLayout({
    children,
}: {
    children: ReactNode;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const headersList = await headers();
    const pathname = headersList.get("x-pathname") ?? "/dashboard/teacher";

    const user = session?.user;
    if (user === null || user === undefined) redirect(signInUrl(pathname));

    if (!isTeacher(user)) {
        redirect("/dashboard/student");
    }

    return <div>{children}</div>;
}
