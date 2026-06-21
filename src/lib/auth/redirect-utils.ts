/**
 * Builds the /sign-in URL with the given path encoded as the `next` query
 * parameter, so the sign-in page can redirect back after successful login.
 */
export function signInUrl(next: string): string {
    return `/sign-in?next=${encodeURIComponent(next)}`;
}

/**
 * Returns `next` if it is a safe, relative URL (starts with a single `/`).
 * Falls back to `fallback` otherwise, preventing open-redirect attacks.
 */
export function getSafeRedirectUrl(
    next: string | null | undefined,
    fallback = "/",
): string {
    if (!next) return fallback;
    // Reject absolute URLs and protocol-relative URLs (//)
    if (!next.startsWith("/") || next.startsWith("//")) return fallback;
    return next;
}
