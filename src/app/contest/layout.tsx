import type { ReactNode } from "react";
import { requireSession } from "~/server/current-membership";

/** Contests are for signed-in users only. */
export default async function ContestLayout({
    children,
}: {
    children: ReactNode;
}) {
    await requireSession("/contest");
    return <>{children}</>;
}
