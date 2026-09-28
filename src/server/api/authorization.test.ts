/**
 * Every tRPC procedure must be deliberately classified here. Adding a
 * procedure without listing it fails the first test, so nothing ships
 * accidentally public.
 *
 * The rejection tests never reach the database: the auth middleware runs
 * before input parsing and the procedure body.
 */
import { describe, expect, test } from "bun:test";
import { TRPCError } from "@trpc/server";
import { appRouter, createCaller } from "./root";

type Access = "public" | "signed-in" | "teacher";

const ACCESS: Record<string, Access> = {
    // Contests
    "contest.getAll": "public",
    "contest.getById": "public",
    "contest.getEnrollments": "teacher",
    "contest.getAllSubmissions": "teacher",
    "contest.getLeaderboard": "signed-in",
    "contest.isEnrolled": "signed-in",
    "contest.enroll": "signed-in",
    "contest.getMyBestPerProblem": "signed-in",
    "contest.submitCode": "signed-in",
    "contest.create": "teacher",
    "contest.update": "teacher",
    "contest.setStatus": "teacher",
    "contest.delete": "teacher",
    "contest.addProblem": "teacher",
    "contest.removeProblem": "teacher",
    "contest.updateProblem": "teacher",
    // Running code
    "execute.getJudge0Status": "teacher",
    "execute.getLanguages": "public",
    "execute.runCode": "signed-in",
    "execute.submitCode": "signed-in",
    // Returns null (no LSP) when signed out rather than rejecting.
    "lsp.getSession": "public",
    // Problem content
    "problem.getProblems": "public",
    "problem.getMinimalProblems": "public",
    "problem.getProblemById": "public",
    "problem.getProblemPreview": "public",
    // Practice submissions
    "submission.getProblemSubmissions": "signed-in",
    "submission.getAcceptedSubmissions": "signed-in",
    "submission.getDeniedSubmissions": "signed-in",
    "submission.getMostRecentSubmission": "signed-in",
    "submission.getAllSubmissions": "teacher",
    "submission.getSubmissionById": "teacher",
    "submission.overrideSubmission": "teacher",
    // Own account
    "user.getMe": "signed-in",
    "user.getUserLeaderboardVisibility": "signed-in",
    "user.toggleLeaderboardVisibility": "signed-in",
    "user.getProblemSubmissions": "signed-in",
    // Written tests (leaderboards only include users who opted in)
    "written.getLeaderboard": "public",
    "written.getAvailableCompetitions": "public",
    "written.getMostRecentCompetition": "public",
    "written.getAvailableYears": "public",
    "written.getMostRecentYear": "public",
    "written.addScore": "teacher",
    "written.getAllUsers": "teacher",
};

const procedurePaths = Object.keys(appRouter._def.procedures).sort();

type Caller = ReturnType<typeof createCaller>;

function callerAs(role: string | null): Caller {
    const session =
        role === null
            ? null
            : {
                  user: { id: `test-${role}`, role },
                  session: { id: "s", userId: `test-${role}` },
              };
    return createCaller({
        headers: new Headers(),
        session: session as never,
    });
}

/** Calls a procedure by path, returning the tRPC error code it throws. */
async function errorCode(caller: Caller, path: string): Promise<string> {
    const [namespace, name] = path.split(".") as [string, string];
    const group = caller[namespace as keyof Caller] as unknown as Record<
        string,
        (input?: unknown) => Promise<unknown>
    >;
    try {
        await group[name]!(undefined);
    } catch (error) {
        if (error instanceof TRPCError) return error.code;
        throw error;
    }
    return "NO_ERROR";
}

const pathsWith = (access: Access) =>
    procedurePaths.filter((p) => ACCESS[p] === access);

describe("authorization", () => {
    test("every procedure is classified", () => {
        expect(procedurePaths).toEqual(Object.keys(ACCESS).sort());
    });

    test.each([...pathsWith("signed-in"), ...pathsWith("teacher")])(
        "%s rejects signed-out callers",
        async (path) => {
            expect(await errorCode(callerAs(null), path)).toBe("UNAUTHORIZED");
        },
    );

    test.each(pathsWith("teacher"))("%s rejects students", async (path) => {
        expect(await errorCode(callerAs("student"), path)).toBe("FORBIDDEN");
    });

    test.each(pathsWith("teacher"))(
        "%s lets teachers past the role check",
        async (path) => {
            // Passes auth, then fails on the missing input (or DB); either
            // way, not an auth error.
            const code = await errorCode(callerAs("teacher"), path).catch(
                () => "OTHER",
            );
            expect(["UNAUTHORIZED", "FORBIDDEN"]).not.toContain(code);
        },
    );
});
