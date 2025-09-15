import { auth } from "auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { db } from "~/server/db";
import { user } from "~/server/db/schema/auth";

export default async function Layout({
    params,
    children,
}: {
    params: Promise<{ problemId: string }>;
    children: ReactNode;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    const problemId = (await params).problemId;
    console.log(problemId);
    await db.update(user).set({
        mostRecentProblem: parseInt(problemId),
    });

    return <>{children}</>;
}
