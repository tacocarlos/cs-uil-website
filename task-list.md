# Task list

Status as of 2026-09-30.

## Where things stand

| State | What | Migrations |
| ----- | ---- | ---------- |
| Pushed to `main` (`52493d8`) | Phases 1–3b: authorization, schools (organizations), school-scoped data and leaderboards, UIL classification, dummy-data script | `0001`–`0004` |
| Committed, **not pushed** (`0faa276`) | Phase 4 (cross-school contests), Phase 5 minimal (join codes, `/admin`, school switcher), written leaderboard → teacher-only, written statistics, former students | `0005`–`0007` |
| **Uncommitted** | Contest access fixes (problems hidden until start; former students out of contests), Phase 5 gaps (manage/rename/delete schools, change teacher roles, students leave schools), recent-submissions fix, cleanups (below), organization endpoint lockdown | none |

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
| 4 | **Cross-school contests** | ✅ Committed | Contests belong to the creating teacher's school; only its teachers manage them. Visibility: school only / invited schools / open. Enrollment records the school a student competes for; contest leaderboards show it. Rules in `src/server/contests.ts`. |
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

None in this repo; see "Before the next deploy" above.

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
