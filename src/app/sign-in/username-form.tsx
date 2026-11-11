"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "auth-client";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    USERNAME_MAX_LENGTH,
    passwordProblem,
    usernameProblem,
} from "~/lib/auth/usernames";
import { LastUsedBadge } from "./last-used-badge";
import { signUpWithUsername } from "./sign-up-action";

type Mode = "sign-in" | "sign-up";

/**
 * Username + password sign-in, or creating such an account (for students
 * who can't use Google). New accounts are signed in right away.
 */
export function UsernameForm({
    callbackURL,
    disabled,
    lastUsed = false,
}: {
    callbackURL: string;
    disabled: boolean;
    /** This browser last signed in with a username. */
    lastUsed?: boolean;
}) {
    const [mode, setMode] = useState<Mode>("sign-in");
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    // Stays true after success while the page navigates away.
    const [pending, setPending] = useState(false);
    // The "last resort" warning shown before switching to sign-up.
    const [warningOpen, setWarningOpen] = useState(false);

    function switchMode(next: Mode) {
        setMode(next);
        setError(null);
        setPassword("");
        setConfirm("");
    }

    async function submit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        if (mode === "sign-up") {
            const problem =
                usernameProblem(username.trim()) ?? passwordProblem(password);
            if (problem) return setError(problem);
            if (password !== confirm) {
                return setError("The passwords don't match.");
            }
        }

        setPending(true);
        try {
            if (mode === "sign-up") {
                const result = await signUpWithUsername({
                    name,
                    username,
                    password,
                });
                if (result.error) {
                    setError(result.error);
                    setPending(false);
                    return;
                }
            }
            const { error } = await signIn.username({
                username: username.trim(),
                password,
                callbackURL,
            });
            if (error) {
                setError(
                    error.status === 401
                        ? "Wrong username or password."
                        : (error.message ?? "Couldn't sign in."),
                );
                setPending(false);
            }
        } catch {
            setError("Something went wrong. Try again.");
            setPending(false);
        }
    }

    const busy = pending || disabled;
    return (
        <form className="grid gap-3" onSubmit={(e) => void submit(e)}>
            {error && (
                <div
                    role="alert"
                    className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border p-3 text-sm"
                >
                    {error}
                </div>
            )}
            {mode === "sign-up" && (
                <div className="grid gap-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        autoComplete="name"
                        required
                        maxLength={100}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
            )}
            <div className="grid gap-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                    id="username"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    maxLength={USERNAME_MAX_LENGTH}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                {mode === "sign-up" && (
                    <p className="text-muted-foreground text-xs">
                        Letters, numbers, underscores, and dots.
                    </p>
                )}
            </div>
            <div className="grid gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    autoComplete={
                        mode === "sign-up" ? "new-password" : "current-password"
                    }
                    required
                    minLength={mode === "sign-up" ? PASSWORD_MIN_LENGTH : 1}
                    maxLength={PASSWORD_MAX_LENGTH}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {mode === "sign-up" && (
                    <p className="text-muted-foreground text-xs">
                        At least {PASSWORD_MIN_LENGTH} characters. There&apos;s
                        no email reset, so pick one you&apos;ll remember.
                    </p>
                )}
            </div>
            {mode === "sign-up" && (
                <div className="grid gap-1.5">
                    <Label htmlFor="confirm-password">Confirm password</Label>
                    <Input
                        id="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        maxLength={PASSWORD_MAX_LENGTH}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                    />
                </div>
            )}
            <Button type="submit" className="relative h-11" disabled={busy}>
                {pending
                    ? mode === "sign-up"
                        ? "Creating account..."
                        : "Signing in..."
                    : mode === "sign-up"
                      ? "Create account"
                      : "Sign in"}
                {lastUsed && mode === "sign-in" && <LastUsedBadge />}
            </Button>
            <p className="text-muted-foreground text-center text-sm">
                {mode === "sign-in" ? "No account yet? " : "Have an account? "}
                <button
                    type="button"
                    className="text-info underline-offset-4 hover:underline"
                    disabled={busy}
                    onClick={() =>
                        mode === "sign-in"
                            ? setWarningOpen(true)
                            : switchMode("sign-in")
                    }
                >
                    {mode === "sign-in" ? "Create one" : "Sign in"}
                </button>
            </p>
            <AlertDialog open={warningOpen} onOpenChange={setWarningOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Use a username only as a last resort
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="grid gap-2">
                                <p>
                                    Username accounts aren&apos;t well
                                    supported. If you can, sign in with Google,
                                    GitHub, or Microsoft instead.
                                </p>
                                <p>
                                    A username account has no email, so if you
                                    forget your password there&apos;s no way to
                                    reset it yourself.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Go back</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => switchMode("sign-up")}
                        >
                            Create a username account
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </form>
    );
}
