"use client";

import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import Image from "next/image";
import { signIn } from "auth-client";

type SignInPageProps = {
    error?: string;
    isLoading: boolean;
};

export default function SignInPage({ error, isLoading }: SignInPageProps) {
    return (
        <main className="bg-primary flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-1/3 rounded-xl border border-white px-5">
                <div className="mb-8 text-center">
                    {/* <Link href="/" className="inline-block">
                        <Image
                            src="/logo.png"
                            alt="CS UIL Logo"
                            width={80}
                            height={80}
                            className="mx-auto"
                        />
                    </Link> */}
                    <h2 className="text-primary-foreground mt-6 text-3xl font-bold tracking-tight">
                        Sign in to CS UIL
                    </h2>
                    <p className="text-primary-foreground mt-2 text-sm">
                        Access your account to track progress and participate in
                        competitions
                    </p>
                </div>

                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-center text-2xl">
                            Welcome back
                        </CardTitle>
                        <CardDescription className="text-center">
                            Sign in using your Google account
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {error && (
                            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <Button
                            variant="outline"
                            className="flex h-12 w-full items-center justify-center gap-2"
                            onClick={async () => {
                                await signIn.social({
                                    provider: "google",
                                });
                            }}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-t-2 border-b-2 border-blue-500" />
                            ) : (
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                    <path d="M1 1h22v22H1z" fill="none" />
                                </svg>
                            )}
                            <span>
                                {isLoading
                                    ? "Signing in..."
                                    : "Sign in with Google"}
                            </span>
                        </Button>
                    </CardContent>
                    <CardFooter className="flex flex-col">
                        <p className="mt-2 text-center text-xs text-gray-500">
                            By signing in, you agree to our{" "}
                            <Link
                                href="/terms"
                                className="underline hover:text-blue-600"
                            >
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link
                                href="/privacy"
                                className="underline hover:text-blue-600"
                            >
                                Privacy Policy
                            </Link>
                        </p>
                    </CardFooter>
                </Card>

                <div className="mt-6 text-center">
                    <Link
                        href="/"
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        Return to home page
                    </Link>
                </div>
            </div>
        </main>
    );
}
