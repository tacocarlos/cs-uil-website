/**
 * The cookie better-auth's lastLoginMethod plugin (auth.ts) sets on sign-in,
 * holding the method used: "google", "github", "microsoft", or "username"
 * (see signInMethod in src/lib/analytics.ts). The sign-in page reads it to
 * mark that option "Last used". It's per-browser and isn't sent anywhere.
 */
export const LAST_LOGIN_METHOD_COOKIE = "uil.last_login_method";
