"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { auth } from "auth";
import { db } from "~/server/db";
import { user } from "~/server/db/schema/auth";
import { member } from "~/server/db/schema/organization";
import { DEV_ACCOUNTS, type DevAccountKind } from "~/lib/auth/dev-accounts";
import { DEV_PASSWORD, devLoginEnabled } from "~/lib/auth/dev-login";
import { DEFAULT_ORGANIZATION, memberRoleFor } from "~/lib/auth/organizations";

/**
 * Creates the dev account on first use and makes sure it has the right
 * role, then returns its credentials for the client to sign in with (via
 * better-auth's normal email sign-in, so cookies are set as usual).
 */
export async function prepareDevAccount(
    kind: DevAccountKind,
): Promise<{ email: string; password: string }> {
    if (!devLoginEnabled()) {
        throw new Error("Dev login is disabled");
    }
    const account = DEV_ACCOUNTS[kind];
    if (!account) throw new Error(`Unknown dev account "${String(kind)}"`);

    const [existing] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, account.email))
        .limit(1);

    if (!existing) {
        await auth.api.signUpEmail({
            body: {
                name: account.name,
                email: account.email,
                password: DEV_PASSWORD,
            },
        });
    }

    // Role can't be set at sign-up (it's not user input), so set it here,
    // along with the matching role in the default school.
    const [updated] = await db
        .update(user)
        .set({ role: account.role })
        .where(eq(user.email, account.email))
        .returning({ id: user.id });
    if (!updated) throw new Error(`Dev account ${account.email} is missing`);

    const role = memberRoleFor(account.role);
    await db
        .insert(member)
        .values({
            id: randomUUID(),
            organizationId: DEFAULT_ORGANIZATION.id,
            userId: updated.id,
            role,
            createdAt: new Date(),
        })
        .onConflictDoUpdate({
            target: [member.organizationId, member.userId],
            set: { role },
        });

    return { email: account.email, password: DEV_PASSWORD };
}
