import { auth } from "auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { signInUrl } from "~/lib/auth/redirect-utils";

export const metadata = { title: "Code Sandbox" };

// Running code uses Judge0, so the sandbox is for signed-in users only.
export default async function Layout({ children }: { children: ReactNode }) {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session) {
        redirect(signInUrl(headersList.get("x-pathname") ?? "/sandbox"));
    }

    return <>{children}</>;
}
