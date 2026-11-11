import { env } from "~/env";
import { enabledProviders, oauthCredentials } from "~/lib/auth/oauth-providers";

/** OAuth credentials from the env (see src/lib/auth/oauth-providers.ts). */
export const oauth = oauthCredentials(env);

/** The OAuth providers to offer on the sign-in page. */
export const oauthProviders = enabledProviders(oauth);
