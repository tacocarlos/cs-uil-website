/**
 * Every tRPC procedure must be deliberately classified here. Adding a
 * procedure without listing it fails the first test, so nothing ships
 * accidentally public.
 *
 * The rejection tests never reach the database: the auth middleware runs
 * before input parsing and the procedure body, and the caller's school
 * membership is supplied by the test instead of looked up.
 */
import { describe, expect, test } from "bun:test";
import { TRPCError } from "@trpc/server";
import { type MemberRole } from "~/lib/auth/organizations";
import { appRouter, createCaller } from "./root";

type Access = "public" | "signed-in" | "teacher" | "site-admin";

const ACCESS: Record<string, Access> = {
    // Contests
    "contest.getAll": "public",
    "contest.getById": "public",
    "contest.getMine": "teacher",
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
    "problem.getMinimalProblems": "public",
    "problem.getProblemById": "public",
    "problem.getProblemPreview": "public",
    // Practice submissions
    "submission.getProblemSubmissions": "signed-in",
    "submission.getAcceptedSubmissions": "signed-in",
    "submission.getDeniedSubmissions": "signed-in",
    "submission.getRecentOrgSubmission": "teacher",
    "submission.overrideSubmission": "teacher",
    // School classification: teachers edit their own school, site admins
    // any school
    "school.lookup": "teacher",
    "school.getMine": "teacher",
    "school.setMyClassification": "teacher",
    "school.regenerateJoinCode": "teacher",
    "school.listMembers": "teacher",
    "school.removeMember": "teacher",
    "school.setFormer": "teacher",
    "school.join": "signed-in",
    "school.listMine": "signed-in",
    "school.leave": "signed-in",
    "school.listTeachers": "site-admin",
    "school.setMemberRole": "site-admin",
    "school.removeFromSchool": "site-admin",
    "school.rename": "site-admin",
    "school.delete": "site-admin",
    "school.search": "site-admin",
    "school.setClassification": "site-admin",
    "school.create": "site-admin",
    "school.addTeacher": "site-admin",
    // Own account
    "user.getMe": "signed-in",
    "user.toggleLeaderboardVisibility": "signed-in",
    "user.setGlobalLeaderboardVisibility": "signed-in",
    // Written tests: teachers only, for their own school's students
    "written.getLeaderboard": "teacher",
    "written.getAvailableCompetitions": "teacher",
    "written.getMostRecentCompetition": "teacher",
    "written.getAvailableYears": "teacher",
    "written.getStatistics": "teacher",
    "written.addScore": "teacher",
    "written.getAllUsers": "teacher",
};

const procedurePaths = Object.keys(appRouter._def.procedures).sort();

type Caller = ReturnType<typeof createCaller>;

/**
 * A caller who is signed out (null), signed in with no active school
 * ("no-school"), a site admin with no active school ("site-admin"), or
 * signed in with the given role in their active school.
 */
function callerAs(who: MemberRole | "no-school" | "site-admin" | null): Caller {
    const session =
        who === null
            ? null
            : {
                  user: {
                      id: `test-${who}`,
                      role: who === "site-admin" ? "site-admin" : "student",
                  },
                  session: { id: "s", userId: `test-${who}` },
              };
    const membership =
        who === null || who === "no-school" || who === "site-admin"
            ? null
            : { organizationId: "test-school", role: who };
    return createCaller({
        headers: new Headers(),
        session: session as never,
        getActiveMembership: async () => membership,
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

    test.each([
        ...pathsWith("signed-in"),
        ...pathsWith("teacher"),
        ...pathsWith("site-admin"),
    ])("%s rejects signed-out callers", async (path) => {
        expect(await errorCode(callerAs(null), path)).toBe("UNAUTHORIZED");
    });

    test.each(pathsWith("teacher"))("%s rejects students", async (path) => {
        expect(await errorCode(callerAs("member"), path)).toBe("FORBIDDEN");
    });

    test.each(pathsWith("teacher"))(
        "%s rejects users without an active school",
        async (path) => {
            expect(await errorCode(callerAs("no-school"), path)).toBe(
                "FORBIDDEN",
            );
        },
    );

    test.each(pathsWith("teacher"))(
        "%s lets school owners and admins past the role check",
        async (path) => {
            for (const role of ["owner", "admin"] as const) {
                // Passes auth, then fails on the missing input (or DB);
                // either way, not an auth error.
                const code = await errorCode(callerAs(role), path).catch(
                    () => "OTHER",
                );
                expect(["UNAUTHORIZED", "FORBIDDEN"]).not.toContain(code);
            }
        },
    );

    test.each(pathsWith("site-admin"))(
        "%s rejects school owners who aren't site admins",
        async (path) => {
            expect(await errorCode(callerAs("owner"), path)).toBe("FORBIDDEN");
        },
    );

    test.each(pathsWith("site-admin"))(
        "%s lets site admins past the role check",
        async (path) => {
            const code = await errorCode(callerAs("site-admin"), path).catch(
                () => "OTHER",
            );
            expect(["UNAUTHORIZED", "FORBIDDEN"]).not.toContain(code);
        },
    );
});
