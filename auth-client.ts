import { createAuthClient } from "better-auth/react";
import {
    inferAdditionalFields,
    organizationClient,
} from "better-auth/client/plugins";
import { type auth } from "auth";
export const { signIn, signUp, signOut, useSession, useActiveMember } =
    createAuthClient({
        plugins: [inferAdditionalFields<typeof auth>(), organizationClient()],
    });
