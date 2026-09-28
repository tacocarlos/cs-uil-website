# Task list

## Multi-school support (organizations)

Goal: let teachers and students from other schools compete in contests and
practice on the site.

### Starting point (as of 2026-09-27)

- All tRPC procedures were `publicProcedure`, and many trusted a `userId`
  sent by the browser. Teacher-only access was enforced only by
  `dashboard/teacher/layout.tsx`. → Addressed by Phase 1.
- 7 pages query the database directly (dashboards, contests, leaderboard);
  they need school scoping too.
- "Teacher" is one global `role` string on the user. `schema/role.ts`
  (roles / permissions / userRoles / rolePermissions) is a mostly unused
  permission system, only touched by `dashboard/page.tsx` via
  `lib/user/permission-utils.ts`; replace or remove it.
- better-auth 1.4.7 ships an **organization plugin** (orgs, members with
  owner/admin/member roles, invitations, active organization on the
  session, access control). `@better-auth/cli` is installed and can
  generate its tables.

### Phases

| # | Phase | Size | Notes |
| - | ----- | ---- | ----- |
| 1 | ✅ **Server-side authorization** | M–L | Done. `protectedProcedure` / `teacherProcedure` read the user from the session; no procedure accepts a client `userId`. `src/server/api/authorization.test.ts` classifies every procedure and fails on unclassified ones. |
| 2 | **Organizations** | S–M | Enable the better-auth organization plugin, generate the migration, move existing users into a default org for the current school (prod migration via `db:migrate`). |
| 3 | **Scoped data** | M | Practice submissions, written tests, teacher dashboard, score overrides, and leaderboards filter by organization; teachers only see/override their own students. |
| 4 | **Cross-school contests** | M | Contests owned by an org with visibility (org-only / invite-only / open) and matching enrollment rules; leaderboards show each student's school. |
| 5 | **Management UI** | M–L | Create org, invite teachers, students join, member management, site-admin view, school switcher (if multi-membership). |

Phases 1–3 make the site safely multi-school; 4–5 make it feel like a
platform.

### Decisions needed before Phase 2

1. **Membership:** can a user belong to more than one school? (Yes means a
   school switcher and an "active school" on every request.)
2. **Joining:** how do students join — join code/link from their teacher
   (recommended), email-domain matching, or teacher-created accounts?
3. **Creating schools:** self-serve for any teacher, or approved by a site
   admin? (Approval recommended, to prevent spam schools.)
4. **Visibility:** is the practice leaderboard shared across schools (with a
   school filter) or per-school only? Users are mostly minors, so exposing
   names and scores across schools should be a deliberate choice (the
   `showScoresInLeaderboard` setting helps).
5. **Roles:** keep "site admin" global; make "teacher" a per-school role
   (owner/admin) instead of a global flag?

## Other follow-ups

- **Problem API data (urgent, api.lunaghs.dev's domain): 37 of 48 problems
  can't be solved here.** Their `test_output_url` file contains the problem
  statement Markdown instead of the expected output, so every submission is
  rejected. Found 2026-09-27; broken IDs: 4–12, 15–17, 19–25, 29, 31–37,
  40–49. This site only compares against the stored test output; producing
  and validating it (including running reference solutions) belongs to
  api.lunaghs.dev.
- **Student code written UIL-style may not match the judge:** UIL programs
  typically use `public class <ProblemName>` (Judge0 compiles `Main.java`)
  and read input from `<name>.dat` (the judge feeds stdin). Students who
  follow the starter code are fine. Options: rename a student's public class
  to `Main` before judging, and/or supply the test input as `<name>.dat` via
  Judge0 `additional_files`.
- F# on this Judge0 takes ~3–5 s of the 5 s CPU limit just to start, so even
  `printfn "hello"` can time out. Consider a higher per-submission limit for
  F#, or hiding it.

- Contest problem pages (`contest/[contestId]/problem/[label]`) don't check
  the contest's status, so problems are viewable before a contest starts.
  (Submitting is blocked server-side.) This is task 5.3 in
  `websocket-assignment.md`, left for that assignment.
- Unused procedures, secured in Phase 1 but called by nothing: consider
  removing `submission.getMostRecentSubmission`, `getAllSubmissions`,
  `getSubmissionById`, `user.getUserLeaderboardVisibility`,
  `getProblemSubmissions`, `contest.getEnrollments`,
  `written.getMostRecentYear`, and `problem.getProblems`.

- Rebuild the Judge0 VM on Ubuntu 24.04 (systemd 259 on 26.04 dropped
  cgroup v1, so no code can run until then). Then re-run a real submission
  to confirm stdin and grading work.
- Pin pyright and clangd in `lsp-gateway/Dockerfile` (jdtls is pinned).
- `NEXT_PUBLIC_JUDGE_URL` in `src/env.js` is declared but unused; remove it.
- Deploy the LSP gateway for production: `wss://` behind a proxy,
  `ALLOWED_ORIGINS` set to the real site, a separate secret.
