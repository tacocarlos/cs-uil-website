import type { ReactNode } from "react";
import { requireSession } from "~/server/current-membership";

export const metadata = { title: "Code Sandbox" };

// Running code uses Judge0, so the sandbox is for signed-in users only.
export default async function Layout({ children }: { children: ReactNode }) {
    await requireSession("/sandbox");
    return <>{children}</>;
}
