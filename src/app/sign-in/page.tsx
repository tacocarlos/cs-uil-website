import { cookies } from "next/headers";
import { devLoginEnabled } from "~/lib/auth/dev-login";
import { LAST_LOGIN_METHOD_COOKIE } from "~/lib/auth/last-login";
import SignInPage from "./signin";

export default async function SignIn({
    searchParams,
}: {
    searchParams: Promise<{ next?: string }>;
}) {
    const { next } = await searchParams;
    // Read here rather than in the browser so the badge is in the first
    // render instead of popping in after hydration.
    const lastMethod =
        (await cookies()).get(LAST_LOGIN_METHOD_COOKIE)?.value ?? null;
    return (
        <SignInPage
            next={next}
            showDevLogin={devLoginEnabled()}
            lastMethod={lastMethod}
        />
    );
}
