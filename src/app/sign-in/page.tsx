import { signIn } from "auth-client";
import SignInPage from "./signin";
import { env } from "~/env";

export default function SignIn() {
    if (env.NODE_ENV === "development") {
        return <SignInPage isLoading={false} />;
    }

    return <div>Signing in is not available at this time.</div>;
}
