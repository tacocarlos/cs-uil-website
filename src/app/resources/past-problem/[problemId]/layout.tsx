import { auth } from "auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { signInUrl } from "~/lib/auth/redirect-utils";

export default async function Layout({ children }: { children: ReactNode }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        const headersList = await headers();
        const pathname = headersList.get("x-pathname") ?? "/";
        redirect(signInUrl(pathname));
    }

    return <>{children}</>;
}
