import { env } from "~/env";
import { type prairielearnCourse } from "~/server/db/schema/prairielearn";
import { PrairieLearnError, type Connection } from "./api";
import { decryptToken, encryptToken } from "./token";

type CourseRow = Pick<
    typeof prairielearnCourse.$inferSelect,
    "serverUrl" | "courseInstanceId" | "encryptedToken"
>;

/**
 * Whether a course instance ID can exist in PrairieLearn, where they're
 * numbers (teachers can only enter numbers). Others are made up, like the
 * dev seed data's "seed" (dev-scripts/seed-dummy-data.ts), and are never
 * synced, which would replace their rows with PrairieLearn's.
 */
export function isRealCourseInstanceId(courseInstanceId: string): boolean {
    return /^\d+$/.test(courseInstanceId);
}

export function sealToken(token: string): string {
    return encryptToken(token, env.BETTER_AUTH_SECRET);
}

/**
 * How to reach a school's course, or null if there's nothing to sync: no
 * course connected yet, or a made-up one. Throws PrairieLearnError if the
 * saved token can't be read anymore (BETTER_AUTH_SECRET changed).
 */
export function connectionOf(course: CourseRow): Connection | null {
    const { serverUrl, courseInstanceId, encryptedToken } = course;
    if (!serverUrl || !courseInstanceId || !encryptedToken) return null;
    if (!isRealCourseInstanceId(courseInstanceId)) return null;
    const token = decryptToken(encryptedToken, env.BETTER_AUTH_SECRET);
    if (token === null) {
        throw new PrairieLearnError(
            "The saved PrairieLearn token can't be read anymore. Enter it again.",
        );
    }
    return { serverUrl, courseInstanceId, token };
}
