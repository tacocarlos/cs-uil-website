import { auth } from "auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function TeacherLayout({
    children,
}: {
    children: ReactNode;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const user = session?.user;
    if (user === null || user === undefined) redirect("/sign-in");

    if (user.role != "teacher") {
        redirect("/dashboard/student");
    }

    return <div>{children}</div>;
}
