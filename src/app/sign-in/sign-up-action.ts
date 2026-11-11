"use server";

import { randomUUID } from "node:crypto";
import { APIError } from "better-auth/api";
import { auth } from "auth";
import {
    passwordProblem,
    placeholderEmail,
    usernameProblem,
} from "~/lib/auth/usernames";

const NAME_MAX_LENGTH = 100;

/**
 * Creates a username account (no email; see src/lib/auth/usernames.ts).
 * Doesn't sign in: the browser does that next with signIn.username, so the
 * session cookie is set the normal way. Problems are returned, not thrown,
 * so their messages reach the form in production.
 */
export async function signUpWithUsername(input: {
    name: string;
    username: string;
    password: string;
}): Promise<{ error: string | null }> {
    const name = input.name.trim();
    const username = input.username.trim();
    if (!name) return { error: "Enter your name." };
    if (name.length > NAME_MAX_LENGTH) {
        return {
            error: `Names can have at most ${NAME_MAX_LENGTH} characters.`,
        };
    }
    const problem =
        usernameProblem(username) ?? passwordProblem(input.password);
    if (problem) return { error: problem };

    try {
        await auth.api.signUpEmail({
            body: {
                name,
                username,
                email: placeholderEmail(randomUUID()),
                password: input.password,
            },
        });
        return { error: null };
    } catch (err) {
        if (err instanceof APIError) {
            if (err.body?.code === "USERNAME_IS_ALREADY_TAKEN") {
                return { error: "That username is taken. Try another." };
            }
            return { error: err.body?.message ?? "Couldn't create account." };
        }
        throw err;
    }
}
