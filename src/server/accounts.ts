import { eq, sql } from "drizzle-orm";
import { PLACEHOLDER_EMAIL_DOMAIN } from "~/lib/auth/usernames";
import { user } from "~/server/db/schema/auth";

/**
 * SQL for accountLabel (src/lib/auth/usernames.ts): the user's email, or
 * "@username" for username accounts, whose email is a placeholder. Select
 * this wherever an email would be shown.
 */
export const accountLabelSql = sql<string>`case when lower(${user.email}) like ${`%@${PLACEHOLDER_EMAIL_DOMAIN}`} then '@' || coalesce(${user.displayUsername}, ${user.username}, '') else ${user.email} end`;

/**
 * Matches the user identified by `account`: an email address, or a username
 * (with or without a leading "@").
 */
export function userByAccount(account: string) {
    const value = account.trim();
    if (value.includes("@") && !value.startsWith("@")) {
        return eq(sql`lower(${user.email})`, value.toLowerCase());
    }
    return eq(user.username, value.replace(/^@/, "").toLowerCase());
}
