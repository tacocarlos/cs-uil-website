import { z } from "zod";
import { env } from "~/env";
import { normalizeServerUrl, resolvesToPublicAddresses } from "./server-url";

/**
 * Read-only access to PrairieLearn's API (https://docs.prairielearn.com/api/)
 * with a teacher's personal access token. Only the fields the site uses are
 * parsed.
 */

/** A school's course instance and how to reach it. */
export type Connection = {
    /** The server's origin, e.g. https://us.prairielearn.com */
    serverUrl: string;
    token: string;
    courseInstanceId: string;
};

/** A failed request, with a message fit to show a teacher. */
export class PrairieLearnError extends Error {
    override name = "PrairieLearnError";
}

const TIMEOUT_MS = 20_000;

/**
 * Development allows plain HTTP and local addresses, for a PrairieLearn
 * running locally; elsewhere only public HTTPS servers are contacted.
 */
const allowLocal = () => env.NODE_ENV === "development";

/**
 * Throws unless the server may be contacted (see server-url.ts). Checked on
 * every request, as a name can start resolving somewhere else.
 */
export async function assertReachableServer(serverUrl: string): Promise<void> {
    if (allowLocal()) return;
    if (normalizeServerUrl(serverUrl) !== serverUrl) {
        throw new PrairieLearnError(
            "The PrairieLearn address must be an https:// address.",
        );
    }
    if (!(await resolvesToPublicAddresses(new URL(serverUrl).hostname))) {
        throw new PrairieLearnError(
            "That PrairieLearn address isn't a public server the site can reach.",
        );
    }
}

async function get<T>(
    { serverUrl, token }: Connection,
    path: string,
    schema: z.ZodType<T>,
): Promise<T> {
    await assertReachableServer(serverUrl);
    const url = new URL(`/pl/api/v1${path}`, serverUrl).toString();

    let res: Response;
    try {
        res = await fetch(url, {
            headers: { "Private-Token": token },
            cache: "no-store",
            // Following a redirect could lead past the address checks.
            redirect: "error",
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
    } catch {
        throw new PrairieLearnError(
            "Couldn't reach PrairieLearn at that address.",
        );
    }
    if (res.status === 401) {
        throw new PrairieLearnError(
            "PrairieLearn rejected the access token. It may have been deleted; enter a new one.",
        );
    }
    if (res.status === 403 || res.status === 404) {
        throw new PrairieLearnError(
            "PrairieLearn has no such course instance, or the token's owner isn't an instructor in it.",
        );
    }
    if (!res.ok) {
        throw new PrairieLearnError(
            `PrairieLearn answered with an error (HTTP ${res.status}).`,
        );
    }

    let body: unknown;
    try {
        body = await res.json();
    } catch {
        body = undefined;
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        throw new PrairieLearnError(
            "That address didn't answer like a PrairieLearn server.",
        );
    }
    return parsed.data;
}

/** IDs arrive as strings (or occasionally numbers); keep them as strings. */
const id = z.union([z.string(), z.number()]).transform(String);

const courseInstanceSchema = z.object({
    course_instance_id: id,
    course_instance_long_name: z.string().nullable(),
    course_instance_short_name: z.string().nullable(),
    course_title: z.string().nullable(),
});

const assessmentSchema = z.object({
    assessment_id: id,
    title: z.string().nullable(),
    assessment_order_by: z.number().nullable(),
});

const assessmentInstanceSchema = z.object({
    assessment_instance_id: id,
    assessment_id: id,
    user_id: id,
    user_uid: z.string(),
    user_name: z.string().nullable(),
    user_role: z.string().nullable(),
    points: z.number().nullable(),
    max_points: z.number().nullable(),
    start_date: z.string().nullable(),
    open: z.boolean().nullable(),
});

const instanceQuestionSchema = z.object({
    /** Graded submissions; 0 (or null) if the question was left blank. */
    number_attempts: z.number().nullable(),
    /** The last submission's grade, 0 to 1. */
    last_submission_score: z.number().nullable(),
});

export type PrairieLearnCourseInstance = z.infer<typeof courseInstanceSchema>;
export type PrairieLearnAssessment = z.infer<typeof assessmentSchema>;
export type PrairieLearnAssessmentInstance = z.infer<
    typeof assessmentInstanceSchema
>;

const ciPath = ({ courseInstanceId }: Connection) =>
    `/course_instances/${encodeURIComponent(courseInstanceId)}`;

export function getCourseInstance(c: Connection) {
    return get(c, ciPath(c), courseInstanceSchema);
}

export function listAssessments(c: Connection) {
    return get(c, `${ciPath(c)}/assessments`, z.array(assessmentSchema));
}

/** Every attempt at an assessment, by every user (students and staff). */
export function listAssessmentInstances(c: Connection, assessmentId: string) {
    return get(
        c,
        `${ciPath(c)}/assessments/${encodeURIComponent(assessmentId)}/assessment_instances`,
        z.array(assessmentInstanceSchema),
    );
}

/** The questions in one attempt, with how each was answered. */
export function listInstanceQuestions(
    c: Connection,
    assessmentInstanceId: string,
) {
    return get(
        c,
        `${ciPath(c)}/assessment_instances/${encodeURIComponent(assessmentInstanceId)}/instance_questions`,
        z.array(instanceQuestionSchema),
    );
}

/** How a course instance is named on the site, e.g. "CS UIL: CY2027". */
export function courseInstanceName(ci: PrairieLearnCourseInstance): string {
    const instance =
        ci.course_instance_short_name ?? ci.course_instance_long_name;
    return (
        [ci.course_title, instance].filter(Boolean).join(": ") ||
        `Course instance ${ci.course_instance_id}`
    );
}
