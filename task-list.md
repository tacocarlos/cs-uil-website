# Task list

Status as of 2026-09-30.

## Where things stand

| State | What | Migrations |
| ----- | ---- | ---------- |
| Pushed to `main` (`52493d8`) | Phases 1–3b: authorization, schools (organizations), school-scoped data and leaderboards, UIL classification, dummy-data script | `0001`–`0004` |
| Committed, **not pushed** (`0faa276`) | Phase 4 (cross-school contests), Phase 5 minimal (join codes, `/admin`, school switcher), written leaderboard → teacher-only, written statistics, former students | `0005`–`0007` |
| **Uncommitted** | Contest access fixes (problems hidden until start; former students out of contests), Phase 5 gaps (manage/rename/delete schools, change teacher roles, students leave schools), recent-submissions fix, cleanups (below), organization endpoint lockdown, contest management model (school vs. global contests, declining invitations) | `0008` |

Production Vercel builds apply pending migrations before building
(`vercel.json` → `scripts/vercel-build.sh`; previews never migrate).

**Before the next deploy:**

1. Check the Vercel build log of the `52493d8` deploy for "Applying
   database migrations" to confirm `0001`–`0004` ran on prod. (Before the
   first migrating deploy, prod's `drizzle.__drizzle_migrations` needed the
   baseline row; if that deploy failed, that's the likely cause.)
2. Back up prod. `0006` rewrites data: existing contests become Groveton's
   (school-only) and existing enrollments get the student's earliest school.
3. Commit the uncommitted work, push, and smoke-test: sign-in, the
   leaderboards, a contest lobby, the teacher dashboard, `/admin`.
4. After deploying: set Groveton's classification and create its join code
   from the teacher dashboard (existing schools have no code until then).

## Multi-school support (organizations)

Goal: let teachers and students from other schools compete in contests and
practice on the site. All phases are done in code.

| # | Phase | Status | Notes |
| - | ----- | ------ | ----- |
| 1 | **Server-side authorization** | ✅ Deployed | `protectedProcedure` / `teacherProcedure` / `siteAdminProcedure` take the user from the session; no procedure accepts a client `userId`. `src/server/api/authorization.test.ts` classifies every procedure and fails on unclassified ones. |
| 2 | **Organizations** | ✅ Pushed | better-auth organization plugin; a school is an organization. Tables `uil_organization` / `uil_member` / `uil_invitation` (unused: no email) plus `uil_session.active_organization_id`. Existing users were moved into Groveton High School (`groveton-hs`): site admins → owner, teachers → admin, others → member. Sessions start in the user's earliest school. |
| 3 | **Scoped data** | ✅ Pushed | Teacher access = owner/admin of the active school; the global `role` only matters for `site-admin`. Teacher views, overrides, and written scores only cover the teacher's school (`inSchool()` in `src/server/organizations.ts`). Old role tables dropped (`0003`). |
| 3b | **School classification** | ✅ Pushed | UIL conference (1A–6A), academic district, region per school (`src/lib/schools.ts`), set by the school's teachers (dashboard) or site admins (`/admin`). The "All schools" leaderboard filters by them. |
| 4 | **Cross-school contests** | ✅ Committed (management model uncommitted) | Two kinds of contest (`src/server/contests.ts`). **School contests** are hosted by a school; its teachers create and manage them (host school only, or host + invited schools). Invited schools' teachers can decline (and accept again); declining hides the contest from their students, but enrolled students keep their results. **Global contests** have no host (`0008` makes the host optional, with a check that only global contests lack one) and are created by site admins only. **Site admins** manage every contest: create global ones or host one at any school, edit, change status, delete, move between hosts. Teachers follow their own students' submissions in contests they don't manage. Enrollment records the school a student competes for; contest leaderboards show it. Management UI: `/dashboard/teacher/contests` (also linked from `/admin`). |
| 5 | **Management UI** | ✅ Committed (gaps uncommitted) | Site admins (`/admin`, searchable): create schools, add teachers by email, rename/delete schools (not Groveton), change teachers' roles or remove them. Teachers: join code + link (`/join?code=`), member list, remove students, mark former. Students: `/join`, "Your schools" with Leave. Navbar: "Join a School", school switcher. New sign-ups have no school until they use a code. |

### Decisions (2026-09-29)

1. **Membership:** users can belong to several schools; the session has an
   active school, with a switcher.
2. **Joining:** join code/link from a teacher only. No email invitations
   (no email server; students may not get email).
3. **Creating schools:** site admins only.
4. **Leaderboard visibility:** defaults to the user's school. The "All
   schools" view is opt-in per student and viewable by anyone; it shows
   each student's school and filters by classification.
5. **Roles:** "site admin" is global; "teacher" is a per-school role
   (owner/admin).
6. **Contests (2026-10-01):** teachers create contests for their own school
   and may invite other schools, whose teachers can decline. Global
   contests are site-admin only. Site admins can create contests for any
   school or globally, and manage and delete every contest. Teachers see
   their own students' submissions in any contest.

## Other features (2026-09-29 – 2026-09-30)

- **Leaderboard:** programming only (the written leaderboard is now
  teacher-only); 10–50 rows per page; gold/silver/bronze for the top 3 and
  a faint tint for 4th–6th; school names and school search on "All
  schools".
- **Written tests (teachers only):** record scores, ranked view at
  `/dashboard/teacher/written/leaderboard`, statistics at
  `/dashboard/teacher/written/statistics` for a season or lifetime.
  Student optimal = best score, expected = average; school figures = top 3
  added together, like a UIL team score (`src/lib/written/statistics.ts`).
  "Expected" as the average was an assumption (only optimal was defined).
- **Former students** (`0007`, `uil_member.former_at`): teachers mark
  students who graduate or leave. They keep their account and scores but
  drop out of leaderboards, pickers, recent submissions, and their old
  school's contests (except contests they entered). Teacher written views
  have "Include former students" for trends. Rejoining with a code makes
  them current again.
- **Organization plugin endpoints locked down** (2026-09-30, uncommitted):
  better-auth's own `/api/auth/organization/*` API (delete school, change
  roles, remove members, invitations, …) would bypass the site's rules, so
  a `hooks.before` in `auth.ts` refuses all of it (404) except `set-active`,
  `list`, and `get-active-member` (18 of 21 endpoints blocked;
  `src/lib/auth/organization-endpoints.ts`, tested against the plugin's
  real endpoint list and request handler). Plugin deletion is also off.
  Sessions now start in a current school before a former one.
- **Contest problems hidden until the start:** problem pages and the
  problem list are withheld before `active`, except from the host school's
  teachers (`canSeeProblems`).
- **Dev tooling:** `bun run db:seed` fills a dev database with dummy
  schools, students, and scores (refuses non-dev databases); dev "Admin
  Test" account alongside the dev student and teacher.

## Open items

See "Before the next deploy" above, and the refactor list below.

## Refactor: single source of truth (audit 2026-10-27)

Already done right (copy their pattern): `lib/written/competitions.ts`,
`lib/schools.ts`, `components/feature-request/labels.ts`,
`lib/contest/visibility.ts`. 🐛 = also fixes a real bug.

### High impact

- [x] **1. Member roles (`owner`/`admin`/`member`)**: defined in 6+
      places. Add `MEMBER_ROLES`, `TEACHER_ROLES`, `MEMBER_ROLE_LABELS` to
      `src/lib/auth/organizations.ts` and derive the rest.
    - `uil_member.role` is untyped `text`, hence `as MemberRole` casts
      (`src/server/organizations.ts`); use `text("role", { enum })`.
    - `school.ts`: `z.enum([...])` in `setMemberRole`;
      `inArray(member.role, ["owner","admin"])` in `listTeachers`
      repeats `isTeacherRole`; the `CASE` ordering in `listMembers`.
    - Labels disagree across `teacher/school-members.tsx`,
      `admin/manage-school.tsx` (plus an inline union type), and
      `student/my-schools.tsx`.
- [x] **2. Global user role**: the `"site-admin"` check is repeated in
      10 places (`trpc.ts`, `contests.ts`, admin and teacher layouts, 3
      contest pages, `Navbar.tsx` ×2, root `auth.ts`). The enum is inline
      in `schema/auth.ts`. Add `USER_ROLES` and `isSiteAdmin(user)`.
- [x] **3. Contest status rules** 🐛: put `CONTEST_STATUSES`,
      `STATUS_TRANSITIONS`, `isInProgress()` and `isEnrollable()` in
      `src/lib/contest/status.ts`.
    - Allowed transitions exist only as buttons in
      `teacher/contests/[contestId]/page.tsx`; `contest.setStatus`
      (`routers/contest/admin.ts`) accepts any status, e.g. ended → draft.
      Validate there, and render the buttons from the same table.
    - "In progress" (`active || frozen`) is repeated in `contest/page.tsx`,
      `contest/[contestId]/page.tsx` and `contest-editor.tsx`;
      "enrollable" (`scheduled || active`) in `participation.ts` and
      `contest/[contestId]/page.tsx`.
    - `teacher/contests/page.tsx` has its own `STATUS_STYLES` badge;
      use `ContestStatusBadge` instead.
- [x] **4. Max points (60)** 🐛: a magic number in ~8 places (both schema
      defaults, `DEFAULT_MAX_POINTS`, `calculate-score.ts`,
      `routers/execute.ts`, `override-form.tsx`, `problem-notes.tsx`).
    - `ProblemStatusCard.tsx` hardcodes 60 and ignores
      `submission.maxPoints`.
    - Practice `CalculateScore` has no floor at 0, unlike contest
      `contestPoints`. Merge the penalty rules into one scoring module.
- [ ] **5. Competition levels (`invA`, `district`, …)**: the type is in
      both `lib/api/lunaghs.ts` and `schema/types.ts`. Display formatting
      differs 5 ways: `formatLevel` in `problem-card.tsx` and
      `ProblemStatusCard.tsx`, hardcoded `<SelectItem>`s in
      `problem-list.tsx`, `CompetitionBadge` in `leaderboard/leaderboard.tsx`,
      and `exports.ts` (outputs "InvA 2019"). Add `COMPETITION_LEVEL_LABELS`
      (plus badge colours).

### Medium impact

- [ ] **6. Written leaderboard queries** 🐛: the public
      `leaderboard/written/page.tsx` and `routers/written.ts` run the same
      three queries (scores, distinct years, distinct competitions). Only
      the visibility condition differs. Move them to `src/server/written.ts`
      as builders that take a `where`.
    - `getAvailableCompetitions` and `getMostRecentCompetition` build
      identical conditions.
    - Year parsing is duplicated (`parseWrittenFilter` vs `getYearParam`).
    - Both `.sort()` competitions alphabetically rather than in season
      order; sort by index in `WRITTEN_COMPETITIONS`.
- [ ] **7. "User's current schools" query**: written 4 times (`schoolsOf`
      and `schoolIdsOf` in `server/contests.ts`, `school.leave`, the session
      hook in root `auth.ts`).
- [ ] **8. Auth guards**: 5 layouts (sandbox, past-problem, contest,
      admin, teacher) repeat "session or redirect to sign-in", 3 of them via
      `auth.api.getSession` instead of the cached `getCurrentMembership`.
      `teacher/export/[kind]/route.ts` re-implements the teacher check. Add
      `requireSession(fallbackPath)` and `requireTeacher()` to
      `current-membership.ts`.
- [ ] **9. Navbar links**: desktop and mobile lists have drifted apart
      (desktop has Past Problems and calls the editor "Online Editor";
      mobile has Timeline and Skill Tree and calls it "Sandbox"). Use one
      `NAV_LINKS` array for both.
- [ ] **10. Contest input schemas**: `create` and `update` in
      `routers/contest/admin.ts` repeat the same fields; define once and use
      `.partial()`. The `penaltyPoints: 20` default is repeated in the schema
      and `contest-settings.ts`.
- [ ] **11. App ↔ `lsp-gateway` contract**: server IDs, the token payload
      and Judge0 version pins (Java 13, Python 3.8, gnu11) are synced by
      hand ("must match" comments). Use a shared module, or at least a test
      that fails when they diverge. In the app, `LSP_TARGETS` could become a
      field on `LANGUAGE_FAMILIES`.

### Low impact / cleanup

- [ ] Delete the dead stub `src/app/api/run-problem.ts/route.tsx`.
- [ ] Remove the debug `console.log`s in `leaderboard/page.tsx`, and the
      redundant `accepted` re-check after the query already filters on it.
- [ ] `judge0-status.tsx` sums the worker totals twice.
- [ ] The tab class helper is repeated in `scope-tabs.tsx` and `kind-tabs.tsx`.
- [ ] CSV exports (`server/exports.ts`, written `report.ts`): keep
      headers and values together as `{ header, value }[]` columns.
- [ ] "No such school" `NOT_FOUND` is thrown 4 times in `school.ts` and
      `admin.ts`.

Suggested order: #1–#3 first (most files, and #3 closes the
status-transition gap).

## Cleanups (done 2026-09-30, uncommitted)

- Removed unused procedures: `submission.getMostRecentSubmission`,
  `getAllSubmissions`, `getSubmissionById`,
  `user.getUserLeaderboardVisibility`, `user.getProblemSubmissions`,
  `contest.getEnrollments`, `problem.getProblems`.
- Removed `NEXT_PUBLIC_JUDGE_URL` from `src/env.js` (it only mirrored
  `JUDGE_URL`, which stays).
- Pinned the LSP gateway's language servers: pyright `1.1.414` and clangd
  from LLVM 19 (`clangd-19`), as Dockerfile `ARG`s. Not built yet; rebuild
  with `lsp-gateway/deploy.sh` to pick it up.
- Deleted `dev-scripts/seed-db.ts` (all commented out); `seed-dummy-data.ts`
  replaces it.
- Removed unused imports from the teacher dashboard page.

## Won't do

- Accepting UIL-style student code (`public class <ProblemName>`, reading
  `<name>.dat`): the starter code's `Main` + stdin doesn't change how
  students solve problems (2026-09-29).
- Rate-limiting join-code attempts: ~10¹² possible codes make guessing
  impractical (2026-09-30).

## Infrastructure (done)

- Judge0 VM rebuilt; real submissions run (2026-09-29).
- LSP gateway deployed for production with `lsp-gateway/deploy.sh`, behind
  Caddy, using Bun's baseline build for the host's CPU (2026-09-29).
