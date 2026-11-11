/**
 * The OAuth sign-in providers the site supports. Each is optional: it's
 * turned on by setting both its <NAME>_CLIENT_ID and <NAME>_CLIENT_SECRET
 * (e.g. GITHUB_CLIENT_ID) and off by leaving both unset. Kept free of server
 * imports so the sign-in page can use the ids and labels.
 */

export const OAUTH_PROVIDERS = ["google", "github", "microsoft"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export const OAUTH_PROVIDER_LABELS: Record<OAuthProvider, string> = {
    google: "Google",
    github: "GitHub",
    microsoft: "Microsoft",
};

export type OAuthCredentials = { clientId: string; clientSecret: string };

/**
 * Credentials for each provider configured in `vars` (normally the env).
 * Throws if a provider has only one of its two variables, so a half-set-up
 * provider stops the server from starting instead of showing a button that
 * can't work.
 */
export function oauthCredentials(
    vars: Record<string, string | undefined>,
): Partial<Record<OAuthProvider, OAuthCredentials>> {
    const configured: Partial<Record<OAuthProvider, OAuthCredentials>> = {};
    for (const provider of OAUTH_PROVIDERS) {
        const prefix = provider.toUpperCase();
        // Empty strings count as unset (these checks are truthiness).
        const clientId = vars[`${prefix}_CLIENT_ID`];
        const clientSecret = vars[`${prefix}_CLIENT_SECRET`];
        if (clientId && clientSecret) {
            configured[provider] = { clientId, clientSecret };
        } else if (clientId || clientSecret) {
            const missing = clientId ? "CLIENT_SECRET" : "CLIENT_ID";
            throw new Error(
                `${OAUTH_PROVIDER_LABELS[provider]} sign-in is half configured: set ${prefix}_${missing} too, or unset both ${prefix}_CLIENT_ID and ${prefix}_CLIENT_SECRET.`,
            );
        }
    }
    return configured;
}

/** The configured providers, in OAUTH_PROVIDERS order. */
export function enabledProviders(
    configured: Partial<Record<OAuthProvider, OAuthCredentials>>,
): OAuthProvider[] {
    return OAUTH_PROVIDERS.filter((provider) => configured[provider]);
}

/** "Google", "Google or GitHub", "Google, GitHub, or a username". */
export function joinWithOr(items: readonly string[]): string {
    if (items.length <= 2) return items.join(" or ");
    return `${items.slice(0, -1).join(", ")}, or ${items.at(-1)}`;
}

/** The providers' labels as a list: "Google, GitHub, or Microsoft". */
export function listProviders(providers: readonly OAuthProvider[]): string {
    return joinWithOr(providers.map((p) => OAUTH_PROVIDER_LABELS[p]));
}
