/**
 * Username accounts: the alternative to Google sign-in. Students at schools
 * that block outside email can't verify an address, so these accounts have
 * no email at all. better-auth requires one, so each gets a unique
 * placeholder on the reserved `.invalid` domain, which can never receive
 * mail or collide with a real (Google) address. Kept free of server imports
 * so client components can use it.
 */

export const PLACEHOLDER_EMAIL_DOMAIN = "username.invalid";

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** Letters, digits, underscores, and dots (better-auth's default rule). */
export const USERNAME_PATTERN = /^[a-zA-Z0-9_.]+$/;

/** A fresh placeholder email for a username account. */
export function placeholderEmail(id: string): string {
    return `${id}@${PLACEHOLDER_EMAIL_DOMAIN}`;
}

export function isPlaceholderEmail(email: string): boolean {
    return email.toLowerCase().endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`);
}

/**
 * How to show which account this is: the email, or "@username" for
 * username accounts (whose email is a meaningless placeholder).
 */
export function accountLabel(user: {
    email: string;
    username?: string | null;
    displayUsername?: string | null;
}): string {
    if (!isPlaceholderEmail(user.email)) return user.email;
    const name = user.displayUsername ?? user.username;
    return name ? `@${name}` : "Username account";
}

/** Why `username` isn't allowed, or null if it is. */
export function usernameProblem(username: string): string | null {
    if (username.length < USERNAME_MIN_LENGTH) {
        return `Usernames need at least ${USERNAME_MIN_LENGTH} characters.`;
    }
    if (username.length > USERNAME_MAX_LENGTH) {
        return `Usernames can have at most ${USERNAME_MAX_LENGTH} characters.`;
    }
    if (!USERNAME_PATTERN.test(username)) {
        return "Usernames can only use letters, numbers, underscores, and dots.";
    }
    return null;
}

/** Why `password` isn't allowed, or null if it is. */
export function passwordProblem(password: string): string | null {
    if (password.length < PASSWORD_MIN_LENGTH) {
        return `Passwords need at least ${PASSWORD_MIN_LENGTH} characters.`;
    }
    if (password.length > PASSWORD_MAX_LENGTH) {
        return `Passwords can have at most ${PASSWORD_MAX_LENGTH} characters.`;
    }
    return null;
}

/**
 * better-auth endpoints that use email addresses. Browsers may not call
 * them: there's no email sign-in, and the site sends no mail, so
 * verification and password-reset emails can't work. (Changing email could
 * also let someone squat on a classmate's address.) Server code still uses
 * /sign-up/email to create username accounts, with a placeholder address.
 */
const EMAIL_PATHS = [
    "/sign-in/email",
    "/sign-up/email",
    "/change-email",
    "/send-verification-email",
    "/verify-email",
    "/request-password-reset",
    "/forget-password",
    "/reset-password",
];

/** Whether a browser request to this better-auth path is refused. */
export function isBlockedEmailPath(path: string): boolean {
    return EMAIL_PATHS.some(
        (blocked) => path === blocked || path.startsWith(`${blocked}/`),
    );
}
