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
| 2 | **Organizations** | S–M | Code done 2026-09-29; **not deployed yet**. Production Vercel builds now apply pending migrations (`scripts/vercel-build.sh`), so deploying applies `drizzle/0001`–`0002`; first confirm prod's `drizzle.__drizzle_migrations` has the baseline row and take a backup. Organization plugin enabled (site admins create schools); tables `uil_organization` / `uil_member` / `uil_invitation` plus `uil_session.active_organization_id`. Every user is in Groveton High School (`groveton-hs`): site admins → owner, teachers → admin, others → member. New users join it automatically (hook in `auth.ts`) until join codes exist; sessions start in the user's earliest school. |
| 3 | **Scoped data** | M | Code done 2026-09-29, deploys with Phase 2 (`drizzle/0003` adds `showInGlobalLeaderboard` and **drops the old role tables**: they're empty on dev; check prod first). Teacher access is now owner/admin of the active school (`teacherProcedure`, teacher layout, navbar, dashboard redirect); the global `role` only matters for `site-admin`. Teacher views, score overrides, and written-score entry only cover the teacher's school (`inSchool()` in `src/server/organizations.ts`). Leaderboards show the viewer's school by default; "All schools" (`?view=global`) shows only students who opted in (student settings). Not done: contests (Phase 4). |
| 3b | **School classification** | S | Code done 2026-09-29 (`drizzle/0004`). Schools have a UIL conference (1A–6A), academic district, and region (`src/lib/schools.ts`), editable by the school's teachers (teacher dashboard card) and by site admins for any school (`/admin`, the start of the Phase 5 admin panel; searchable by name, 25 per page), through validated `school.*` procedures; the auth API can't set them (`input: false`). The "All schools" leaderboards filter by them (`?conference=&region=&district=`). Groveton's values: set them from the dashboard after deploying. |
| 4 | **Cross-school contests** | M | Code done 2026-09-30 (`drizzle/0006`: existing contests → Groveton, school-only; enrollments → the student's earliest school). Contests belong to the creating teacher's active school, whose teachers alone manage them and see submissions/enrollments. Visibility: school only (default) / invited schools (`contest_invite`, picked by name search) / open to everyone. Rules in `src/server/contests.ts`; hidden contests are hidden from lists, lobby, problem pages, and leaderboards. Enrollment records the school a student competes for (active school if eligible); contest leaderboards show it. The practice/written "All schools" leaderboards also show each student's school(s) and search by school (2026-09-30). |
| 5 | **Management UI** | M–L | Minimal version code done 2026-09-29 (`drizzle/0005` adds `join_code`). Site admins (`/admin`): create schools, add an existing account as a school's teacher by email. Teachers (dashboard): join code + link (`/join?code=`), regenerate it, member list, remove students. Students: `/join`; dashboard prompts those without a school. Navbar: "Join a School" and a school switcher for multi-school users. New sign-ups no longer auto-join Groveton. Existing schools have no code until a teacher clicks "Create code". Not done: removing/demoting teachers (SQL for now), deleting or renaming schools, leaving a school, rate-limiting join attempts. |

Phases 1–3 make the site safely multi-school; 4–5 make it feel like a
platform.

### Decisions (2026-09-29)

1. **Membership:** users can belong to multiple schools (e.g. a site admin
   who also teaches). Needs an active school on the session and a school
   switcher.
2. **Joining:** join code/link from a teacher only. Students can't be
   assumed to receive email, and there is no email server, so no email
   invitations or domain matching.
3. **Creating schools:** site admins only; no request/approval flow.
4. **Visibility:** the leaderboard defaults to the user's school. A global
   leaderboard (separate view or page) is opt-in per student: only students
   who explicitly allow it appear there. Anyone can view it.
5. **Roles:** "site admin" stays global; "teacher" becomes a per-school
   role (owner/admin) instead of the global flag.

## Other follow-ups

- **Problem API data (api.lunaghs.dev's domain; owner aware, fix planned
  there as of 2026-09-29): 37 of 48 problems can't be solved here.** Their `test_output_url` file contains the problem
  statement Markdown instead of the expected output, so every submission is
  rejected. Found 2026-09-27; broken IDs: 4–12, 15–17, 19–25, 29, 31–37,
  40–49. This site only compares against the stored test output; producing
  and validating it (including running reference solutions) belongs to
  api.lunaghs.dev.
- ~~Student code written UIL-style may not match the judge~~ (`public class
  <ProblemName>`, reading `<name>.dat`). Won't fix (2026-09-29): the starter
  code's `Main` + stdin doesn't change how students solve problems.
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
  `getProblemSubmissions`, `contest.getEnrollments`, and
  `problem.getProblems`. (`written.getMostRecentYear` was removed.)
- ✅ Written test leaderboard removed for students (2026-09-30), to focus the
  site on the programming section. Teachers still record written scores and
  see their own students ranked at `/dashboard/teacher/written/leaderboard`
  (all their students, whatever the leaderboard privacy setting). The
  `written.*` procedures are teacher-only now.
- ✅ Written statistics for teachers (2026-09-30) at
  `/dashboard/teacher/written/statistics`, for a season year or lifetime:
  student optimal = best score, student expected = average score; school
  optimal/expected = the top 3 of those added together, like a UIL team
  score (`src/lib/written/statistics.ts`). "Expected" as the average was
  my assumption; the definition only covered optimal.
- ✅ Former students (2026-09-30, `drizzle/0007` adds `uil_member.former_at`).
  Teachers mark a student former (graduated/left) or restore them from the
  roster. Former students keep their account, membership, and scores, but
  are left out of the "My school" leaderboard, the "All schools" one (if
  former at every school; school filters and names only use current
  schools), and the written score picker. The teacher's written leaderboard
  and statistics have "Include former students" for trends. Not applied to
  contests (eligibility/enrollment) or the teacher's recent-submissions
  list.

- ✅ Rebuilt the Judge0 VM; real submissions run (2026-09-29).
- Pin pyright and clangd in `lsp-gateway/Dockerfile` (jdtls is pinned).
- `NEXT_PUBLIC_JUDGE_URL` in `src/env.js` is declared but unused; remove it.
- ✅ Deployed the LSP gateway for production (2026-09-29) with
  `lsp-gateway/deploy.sh`, behind Caddy.
