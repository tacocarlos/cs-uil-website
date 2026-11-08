import { createAuthClient } from "better-auth/react";
import {
    adminClient,
    inferAdditionalFields,
    organizationClient,
} from "better-auth/client/plugins";
import { type auth } from "auth";
import { accessControl, adminPluginRoles } from "~/lib/auth/permissions";
export const {
    signIn,
    signUp,
    signOut,
    useSession,
    useActiveMember,
    useListOrganizations,
    organization,
    admin,
} = createAuthClient({
    plugins: [
        inferAdditionalFields<typeof auth>(),
        organizationClient(),
        adminClient({ ac: accessControl, roles: adminPluginRoles }),
    ],
});
