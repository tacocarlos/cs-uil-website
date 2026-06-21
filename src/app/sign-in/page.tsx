import SignInPage from "./signin";

export default async function SignIn({
    searchParams,
}: {
    searchParams: Promise<{ next?: string }>;
}) {
    const { next } = await searchParams;
    return <SignInPage isLoading={false} next={next} />;
}
