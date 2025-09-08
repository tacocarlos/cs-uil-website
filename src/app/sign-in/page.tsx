import { signIn } from "auth-client";
import SignInPage from "./signin";
import { env } from "~/env";

export default function SignIn() {
    return <SignInPage isLoading={false} />;
}
