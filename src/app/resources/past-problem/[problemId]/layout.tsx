import type { ReactNode } from "react";
import { requireSession } from "~/server/current-membership";

export default async function Layout({ children }: { children: ReactNode }) {
    await requireSession("/resources/past-problem");
    return <>{children}</>;
}
