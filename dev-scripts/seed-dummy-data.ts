/**
 * Fills a dev database with dummy schools, students, teachers, practice
 * submissions, written test scores, and feature requests, for trying out
 * leaderboards, the school filters, and the request queue.
 *
 *   bun run db:seed            # replace any previous dummy data
 *   bun run db:seed --remove   # just delete it
 *
 * Refuses to run unless dev login is allowed for this database (development,
 * and DATABASE_URL's host is on DEV_LOGIN_DATABASE_HOSTS), so it can't touch
 * production. Dummy users have @seed.local emails and dummy schools have
 * IDs starting with "seed-"; everything else is left alone. The dummy users
 * can't sign in; use the dev accounts for that (they're in Groveton, along
 * with some dummy students). The dev student and teacher also get practice
 * submissions, with IDs starting with "seed-", and runs on a few other
 * problems, if they've signed in before.
 *
 * Groveton also gets the PrairieLearn practice-test leaderboard, turned on
 * and connected to a course with the made-up ID "seed" (never synced, and
 * with no token), unless a teacher has connected it to a real course.
 */
import { randomUUID } from "node:crypto";
import { and, eq, inArray, like } from "drizzle-orm";
import { DEV_ACCOUNTS, type DevAccountKind } from "~/lib/auth/dev-accounts";
import { devLoginEnabled } from "~/lib/auth/dev-login";
import {
    DEFAULT_ORGANIZATION,
    type MemberRole,
} from "~/lib/auth/organizations";
import { DEFAULT_MAX_POINTS, practicePoints } from "~/lib/problems/scoring";
import { type UilTally } from "~/lib/prairielearn/practice-tests";
import { type Conference } from "~/lib/schools";
import { db } from "~/server/db";
import { user } from "~/server/db/schema/auth";
import { member, organization } from "~/server/db/schema/organization";
import { problemRun, submission } from "~/server/db/schema/submission";
import { featureRequest } from "~/server/db/schema/feature-request";
import { ensureDefaultOrganization } from "~/server/organizations";
import { writtenTests } from "~/server/db/schema/written";
import {
    prairielearnAssessment,
    prairielearnAttempt,
    prairielearnCourse,
    prairielearnUser,
} from "~/server/db/schema/prairielearn";

const EMAIL_DOMAIN = "seed.local";
const SCHOOL_ID_PREFIX = "seed-";

// ── Schools ───────────────────────────────────────────────────────────────────
// Some share a district number across conferences (12-4A vs 12-5A) or a
// district within one (23-2A), to exercise the leaderboard filters.

type School = {
    id: string;
    name: string;
    conference: Conference | null;
    region: number | null;
    district: number | null;
};

const SCHOOLS: School[] = [
    {
        id: "seed-bletchley",
        name: "Bletchley Park High School",
        conference: "4A",
        region: 2,
        district: 12,
    },
    {
        id: "seed-bell-labs",
        name: "Bell Labs High School",
        conference: "5A",
        region: 2,
        district: 12,
    },
    {
        id: "seed-parc",
        name: "Xerox PARC Academy",
        conference: "2A",
        region: 3,
        district: 23,
    },
    {
        id: "seed-the-yard",
        name: "The Yard Academy",
        conference: "2A",
        region: 3,
        district: 23,
    },
    // Not classified yet: only shows up when no filter is set.
    {
        id: "seed-unclassified",
        name: "Stanford Online Prep",
        conference: null,
        region: null,
        district: null,
    },
];

// ── People ────────────────────────────────────────────────────────────────────

type Person = {
    name: string;
    /** School IDs; more than one tests multi-school membership. */
    schools: string[];
    role?: MemberRole;
    /** Defaults: shown on the school leaderboard, not the global one. */
    showScores?: boolean;
    global?: boolean;
    /** A former student (graduated) at all their schools. */
    former?: boolean;
};

const GROVETON = DEFAULT_ORGANIZATION.id;

const PEOPLE: Person[] = [
    // Groveton, alongside the dev accounts
    { name: "Ada Lovelace", schools: [GROVETON], global: true },
    // Hidden from every leaderboard.
    { name: "Alan Turing", schools: [GROVETON], showScores: false },
    // Graduated: off the leaderboards, but in the teacher's written views
    // with "Include former students".
    { name: "Grace Hopper", schools: [GROVETON], global: true, former: true },
    { name: "Hasan Piker", schools: [GROVETON], global: true },

    // Bletchley Park (4A)
    { name: "Tony Hoare", schools: ["seed-bletchley"], role: "owner" },
    { name: "Claude Shannon", schools: ["seed-bletchley"], global: true },
    { name: "John von Neumann", schools: ["seed-bletchley"], global: true },
    { name: "Edsger Dijkstra", schools: ["seed-bletchley"] },

    // Bell Labs (5A)
    { name: "Dennis Ritchie", schools: ["seed-bell-labs"], role: "owner" },
    { name: "Ken Thompson", schools: ["seed-bell-labs"], global: true },
    { name: "Frances Allen", schools: ["seed-bell-labs"], global: true },
    { name: "Barbara Liskov", schools: ["seed-bell-labs"] },

    // Xerox PARC (2A)
    { name: "Donald Knuth", schools: ["seed-parc"], role: "owner" },
    { name: "Leslie Lamport", schools: ["seed-parc"], global: true },
    { name: "Radia Perlman", schools: ["seed-parc"], global: true },
    { name: "Tim Berners-Lee", schools: ["seed-parc"] },

    // The Yard (2A, same district as PARC)
    { name: "Margaret Hamilton", schools: ["seed-the-yard"], role: "owner" },
    { name: "Ludwig Ahgren", schools: ["seed-the-yard"], global: true },
    { name: "Anthony Bruno", schools: ["seed-the-yard"], global: true },
    { name: "Aiden Ian McCaig", schools: ["seed-the-yard"], global: true },
    { name: "Nick Vercillo", schools: ["seed-the-yard"] },

    // Stanford Online Prep (unclassified)
    { name: "John McCarthy", schools: ["seed-unclassified"], role: "owner" },
    { name: "Niklaus Wirth", schools: ["seed-unclassified"], global: true },
    // Two schools at once
    {
        name: "Linus Torvalds",
        schools: ["seed-unclassified", "seed-bell-labs"],
        global: true,
    },
];

// ── Scores ────────────────────────────────────────────────────────────────────

/**
 * Problems from api.lunaghs.dev whose stored test output is currently
 * correct (see task-list.md); others show up but can't really be solved.
 */
const PROBLEM_IDS = [1, 2, 3, 13, 14, 18, 26, 27, 28, 30, 38, 39];

/**
 * Problems the dev student and teacher have submitted to, so the past
 * problem list shows every status. All exist on api.lunaghs.dev.
 */
const DEV_PROBLEM_IDS = [
    26, 27, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 47,
    48, 49, 62, 63, 64, 65, 66, 67, 68, 69, 70,
];

/**
 * Problems the dev student and teacher have run code on but not submitted,
 * so they show as started. None are in DEV_PROBLEM_IDS.
 */
const DEV_STARTED_PROBLEM_IDS = [71, 72, 74, 75, 76, 77, 78, 79];

/** Dev accounts that get submissions; created on their first dev login. */
const DEV_SUBMITTERS: DevAccountKind[] = ["student", "teacher"];

/**
 * Prefix for the dev accounts' seeded submission IDs. Those accounts aren't
 * dummy users, so their seeded rows are deleted by ID instead.
 */
const SUBMISSION_ID_PREFIX = "seed-";

/** Written tests per season, with a representative date for each. */
const WRITTEN_SEASONS: { year: number; dates: Record<string, string> }[] = [
    {
        year: 2026,
        dates: {
            "VCM-1": "2025-10-18",
            "VCM-2": "2025-11-15",
            invA: "2026-01-24",
            district: "2026-03-28",
            "VCM-5": "2026-04-11",
            region: "2026-04-25",
        },
    },
    {
        year: 2027,
        dates: {
            "VCM-1": "2026-10-17",
            "VCM-2": "2026-11-14",
            "VCM-3": "2026-12-12",
            invA: "2027-01-23",
            invB: "2027-02-13",
        },
    },
];

type Competition = (typeof writtenTests.$inferInsert)["competition"];

// ── Feature requests ──────────────────────────────────────────────────────────
// Every status and category, with and without a response, plus a withdrawn
// one that shouldn't show up anywhere.

type FeatureRequest = typeof featureRequest.$inferInsert;

const FEATURE_REQUESTS: (Omit<FeatureRequest, "userId"> & {
    from: string;
    daysAgo: number;
})[] = [
    {
        from: "Ada Lovelace",
        daysAgo: 1,
        category: "problem",
        message:
            "Could past problems be filterable by topic? I want to practice just recursion.",
    },
    {
        from: "Claude Shannon",
        daysAgo: 3,
        category: "bug",
        message:
            "The editor loses my code when I switch languages mid-problem.\n\nSteps: open a problem, type some Java, switch to Python, switch back.",
    },
    {
        from: "Tony Hoare",
        daysAgo: 5,
        category: "contest",
        message: "Let teachers extend a contest's end time while it's running.",
        featureStatus: "accepted",
        adminResponse: "Good idea, we'll add this to contest management.",
    },
    {
        from: "Ken Thompson",
        daysAgo: 12,
        category: "problem",
        message: "Show sample input and output side by side.",
        featureStatus: "implemented",
        adminResponse: "Done! The problem page now shows them side by side.",
    },
    {
        from: "Leslie Lamport",
        daysAgo: 20,
        category: "other",
        message: "Dark mode please.",
        featureStatus: "denied",
        adminResponse: "Not planned for this season, sorry.",
    },
    {
        from: "Ludwig Ahgren",
        daysAgo: 8,
        category: "contest",
        message: "A countdown timer on the contest page would help.",
        featureStatus: "accepted",
    },
    {
        from: "Linus Torvalds",
        daysAgo: 2,
        category: "bug",
        message: "Leaderboard shows me twice since I'm in two schools.",
        deletedAt: new Date(),
    },
];

// ── PrairieLearn practice tests ───────────────────────────────────────────────
// Groveton's course. Not a real course instance ID, so it's never synced
// (see isRealCourseInstanceId in src/server/prairielearn/sync.ts).

const SEED_COURSE_INSTANCE_ID = "seed";

/** In PrairieLearn's order, as "<Level> Practice Test" titles give them. */
const PRACTICE_LEVELS = [
    "Invitational A",
    "Invitational B",
    "District",
    "Region",
    "State",
];

/** Questions per practice test (each +6 right, -2 wrong, 0 blank). */
const PRACTICE_QUESTIONS = 15;

/**
 * Users in Groveton's PrairieLearn course. `skill` is the chance of
 * answering a question right; `guesses` the chance of answering one they
 * don't know rather than leaving it blank.
 */
type PrairieLearnPerson = {
    /** Shown in PrairieLearn; for linked users, their account's name. */
    name: string;
    /** Through the LMS (a pseudonymous UID) or with an email (Google). */
    via: "lms" | "email";
    /** The account linked to, by name (or "dev-student"); none if unlinked. */
    linkedTo?: string;
    /** Linked by a teacher rather than by matching email. */
    byTeacher?: boolean;
    skill: number;
    guesses: number;
    /** One of their attempts is still in progress (not ranked). */
    taking?: boolean;
};

const PRAIRIELEARN_PEOPLE: PrairieLearnPerson[] = [
    // Linked by matching email.
    {
        name: "Ada Lovelace",
        via: "email",
        linkedTo: "Ada Lovelace",
        skill: 0.85,
        guesses: 0.3,
    },
    // Hidden from other students; teachers see a "Hidden" badge.
    {
        name: "Alan Turing",
        via: "lms",
        linkedTo: "Alan Turing",
        byTeacher: true,
        skill: 0.9,
        guesses: 0.2,
    },
    // Former student: linked, but never on the leaderboard.
    {
        name: "Grace Hopper",
        via: "email",
        linkedTo: "Grace Hopper",
        skill: 0.8,
        guesses: 0.5,
    },
    // Uses PrairieLearn both ways; both users count as one student.
    {
        name: "Hasan Piker",
        via: "lms",
        linkedTo: "Hasan Piker",
        byTeacher: true,
        skill: 0.55,
        guesses: 0.9,
        taking: true,
    },
    {
        name: "Hasan Piker",
        via: "email",
        linkedTo: "Hasan Piker",
        skill: 0.55,
        guesses: 0.9,
    },
    // Guesses at everything, so often scores below zero.
    {
        name: "Dev Student",
        via: "lms",
        linkedTo: "dev-student",
        byTeacher: true,
        skill: 0.15,
        guesses: 1,
    },
    // Not linked yet: on the teacher's linking page, not the leaderboard.
    { name: "Mystery Student", via: "lms", skill: 0.6, guesses: 0.4 },
    { name: "Ada L.", via: "email", skill: 0.85, guesses: 0.3 },
];

/** Small seeded PRNG, so every run produces the same data. */
function random(seed: number) {
    return () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function slug(name: string) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-$/, "");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function removeDummyData() {
    // Memberships, submissions, scores, and feature requests cascade from
    // users and schools, except the dev accounts' seeded submissions.
    const devSubmissions = await db
        .delete(submission)
        .where(like(submission.id, `${SUBMISSION_ID_PREFIX}%`))
        .returning({ id: submission.id });
    // Runs have no ID to mark, so this also clears any real dev account
    // runs on those problems.
    const { accounts } = await findDevAccounts();
    const devRuns =
        accounts.length === 0
            ? []
            : await db
                  .delete(problemRun)
                  .where(
                      and(
                          inArray(
                              problemRun.userId,
                              accounts.map((a) => a.id),
                          ),
                          inArray(
                              problemRun.problemId,
                              DEV_STARTED_PROBLEM_IDS,
                          ),
                      ),
                  )
                  .returning({ userId: problemRun.userId });
    // Users, attempts, and practice tests cascade from the course.
    const courses = await db
        .delete(prairielearnCourse)
        .where(eq(prairielearnCourse.courseInstanceId, SEED_COURSE_INSTANCE_ID))
        .returning({ id: prairielearnCourse.organizationId });
    const users = await db
        .delete(user)
        .where(like(user.email, `%@${EMAIL_DOMAIN}`))
        .returning({ id: user.id });
    const schools = await db
        .delete(organization)
        .where(like(organization.id, `${SCHOOL_ID_PREFIX}%`))
        .returning({ id: organization.id });
    console.log(
        `Removed ${users.length} dummy users, ${schools.length} dummy ` +
            `schools, ${devSubmissions.length} dev account submissions, ` +
            `${devRuns.length} dev account runs, and ` +
            `${courses.length} PrairieLearn courses.`,
    );
}

/**
 * The DEV_SUBMITTERS accounts that exist (they're created on first dev
 * login), and the emails of those that don't yet.
 */
async function findDevAccounts() {
    const emails = DEV_SUBMITTERS.map((kind) => DEV_ACCOUNTS[kind].email);
    const accounts = await db
        .select({ id: user.id, email: user.email })
        .from(user)
        .where(inArray(user.email, emails));
    const missing = emails.filter((e) => !accounts.some((a) => a.email === e));
    return { accounts, missing };
}

const DUMMY_CODE =
    "public class Main {\n    public static void main(String[] args) {\n        // dummy submission\n    }\n}\n";

/**
 * One to four attempts at a problem over the last 60 days, in order; if
 * `solved`, the last one is accepted.
 */
function attempts(
    rand: () => number,
    now: Date,
    userId: string,
    problemId: number,
    solved: boolean,
): (typeof submission.$inferInsert)[] {
    const pick = (max: number) => Math.floor(rand() * max);
    const count = 1 + pick(4);
    // Spread over the last 60 days.
    const times = Array.from(
        { length: count },
        () => now.getTime() - pick(60 * 24 * 60) * 60_000,
    ).sort((a, b) => a - b);
    return times.map((time, i) => {
        const attempt = i + 1;
        const accepted = solved && attempt === count;
        return {
            problemId,
            userId,
            timeSubmitted: new Date(time),
            points: accepted ? practicePoints(attempt) : 0,
            maxPoints: DEFAULT_MAX_POINTS,
            accepted,
            attemptNumber: attempt,
            submittedCode: DUMMY_CODE,
        };
    });
}

/**
 * Gives the dev student and teacher submissions to DEV_PROBLEM_IDS (about
 * two thirds solved, the rest not yet) and runs on DEV_STARTED_PROBLEM_IDS.
 * Skips any that haven't signed in yet.
 */
async function insertDevActivity(rand: () => number, now: Date) {
    const pick = (max: number) => Math.floor(rand() * max);
    const { accounts, missing } = await findDevAccounts();
    if (missing.length > 0) {
        console.log(
            `No submissions or runs for ${missing.join(", ")}: sign in as ` +
                "them once, then seed again.",
        );
    }
    if (accounts.length === 0) return { submissions: 0, runs: 0 };

    const rows = accounts.flatMap((account) =>
        DEV_PROBLEM_IDS.flatMap((problemId) =>
            attempts(rand, now, account.id, problemId, rand() < 0.65),
        ),
    );
    await db.insert(submission).values(
        rows.map((row) => ({
            ...row,
            id: `${SUBMISSION_ID_PREFIX}${randomUUID()}`,
        })),
    );

    const runs = accounts.flatMap((account) =>
        DEV_STARTED_PROBLEM_IDS.map((problemId) => {
            // First run within the last two weeks, last run since then.
            const first = now.getTime() - pick(14 * 24 * 60) * 60_000;
            const last = first + pick(now.getTime() - first);
            return {
                userId: account.id,
                problemId,
                firstRunAt: new Date(first),
                lastRunAt: new Date(last),
            };
        }),
    );
    await db.insert(problemRun).values(runs);

    return { submissions: rows.length, runs: runs.length };
}

/**
 * Turns the practice-test leaderboard on for Groveton, connected to a
 * made-up course with PRAIRIELEARN_PEOPLE's attempts at each practice test
 * over the last few weeks. Skipped if a teacher has connected Groveton to a
 * real course. Returns how many attempts.
 */
async function insertPrairieLearnData(
    rand: () => number,
    now: Date,
): Promise<number> {
    const [existing] = await db
        .select({ id: prairielearnCourse.courseInstanceId })
        .from(prairielearnCourse)
        .where(eq(prairielearnCourse.organizationId, GROVETON));
    if (existing?.id) {
        console.log(
            `No PrairieLearn data: Groveton is connected to course instance ` +
                `${existing.id}. Disconnect it from the teacher dashboard, ` +
                "then seed again.",
        );
        return 0;
    }
    // Turned on but not connected: replaced by the seeded connection.
    await db
        .delete(prairielearnCourse)
        .where(eq(prairielearnCourse.organizationId, GROVETON));

    const { accounts } = await findDevAccounts();
    const devStudent = accounts.find(
        (a) => a.email === DEV_ACCOUNTS.student.email,
    );
    const devTeacher = accounts.find(
        (a) => a.email === DEV_ACCOUNTS.teacher.email,
    );
    const accountId = (name: string | undefined) =>
        name === "dev-student" ? devStudent?.id : name && `seed-${slug(name)}`;

    await db.insert(prairielearnCourse).values({
        organizationId: GROVETON,
        createdAt: now,
        // A reserved name that can't resolve, so it's plainly not real.
        serverUrl: "https://prairielearn.invalid",
        courseInstanceId: SEED_COURSE_INSTANCE_ID,
        name: "Computer Science UIL: Seed",
        connectedBy: devTeacher?.id ?? null,
        connectedAt: now,
        syncedAt: now,
    });
    const tests = PRACTICE_LEVELS.map((level, i) => ({
        organizationId: GROVETON,
        assessmentId: `seed-${slug(level)}`,
        level,
        position: i + 1,
    }));
    await db.insert(prairielearnAssessment).values(tests);

    const people = PRAIRIELEARN_PEOPLE.map((p, i) => ({
        ...p,
        prairielearnUserId: `seed-${i + 1}`,
        userId: accountId(p.linkedTo),
    })).filter((p) => p.linkedTo === undefined || p.userId !== undefined);
    if (!devStudent) {
        console.log(
            `No PrairieLearn user for ${DEV_ACCOUNTS.student.email}: sign ` +
                "in as them once, then seed again.",
        );
    }
    await db.insert(prairielearnUser).values(
        people.map((p) => ({
            organizationId: GROVETON,
            prairielearnUserId: p.prairielearnUserId,
            uid:
                p.via === "lms"
                    ? `${randomUUID().replaceAll("-", "")}::ciid=seed`
                    : `${slug(p.name)}@${EMAIL_DOMAIN}`,
            name: p.name,
            userId: p.userId ?? null,
            linkedByTeacher: p.byTeacher ?? false,
        })),
    );

    // Everyone takes some tests, some more than once, over four weeks.
    const attempts: (typeof prairielearnAttempt.$inferInsert)[] = [];
    let instance = 0;
    for (const person of people) {
        for (const test of tests) {
            const taking = person.taking === true && test === tests.at(-1);
            // 0 to 3 attempts; at least one at the test being taken.
            const count = Math.max(Math.floor(rand() * 4), taking ? 1 : 0);
            for (let i = 0; i < count; i++) {
                const tally: UilTally = { correct: 0, wrong: 0, skipped: 0 };
                for (let q = 0; q < PRACTICE_QUESTIONS; q++) {
                    if (rand() < person.skill) tally.correct++;
                    else if (rand() < person.guesses) tally.wrong++;
                    else tally.skipped++;
                }
                // The last attempt at the test being taken is in progress.
                const open = taking && i === count - 1;
                const points = tally.correct * 6;
                attempts.push({
                    organizationId: GROVETON,
                    assessmentInstanceId: `seed-${++instance}`,
                    assessmentId: test.assessmentId,
                    prairielearnUserId: person.prairielearnUserId,
                    points: open ? 0 : points,
                    maxPoints: PRACTICE_QUESTIONS * 6,
                    startedAt: new Date(
                        now.getTime() -
                            Math.floor(rand() * 28 * 24 * 60) * 60_000,
                    ),
                    open,
                    // Tallies are only fetched once an attempt is finished.
                    ...(open
                        ? { correct: null, wrong: null, skipped: null }
                        : tally),
                });
            }
        }
    }
    if (attempts.length > 0) {
        await db.insert(prairielearnAttempt).values(attempts);
    }
    return attempts.length;
}

async function insertDummyData() {
    const now = new Date();
    const rand = random(2027);
    const pick = (max: number) => Math.floor(rand() * max);

    await ensureDefaultOrganization();
    await db
        .insert(organization)
        .values(SCHOOLS.map((s) => ({ ...s, slug: s.id, createdAt: now })));

    const users = PEOPLE.map((p) => ({ ...p, id: `seed-${slug(p.name)}` }));
    await db.insert(user).values(
        users.map((p) => ({
            id: p.id,
            name: p.name,
            email: `${slug(p.name)}@${EMAIL_DOMAIN}`,
            emailVerified: true,
            role: p.role ? ("teacher" as const) : ("student" as const),
            showScoresInLeaderboard: p.showScores ?? true,
            showInGlobalLeaderboard: p.global ?? false,
            createdAt: now,
            updatedAt: now,
        })),
    );

    await db.insert(member).values(
        users.flatMap((p) =>
            p.schools.map((organizationId) => ({
                id: `${p.id}-${organizationId}`,
                organizationId,
                userId: p.id,
                role: p.role ?? "member",
                createdAt: now,
                formerAt: p.former ? now : null,
            })),
        ),
    );

    const students = users.filter((p) => !p.role);

    // Each student tries a random subset of problems; most get accepted
    // after a few attempts.
    const submissions: (typeof submission.$inferInsert)[] = [];
    for (const student of students) {
        for (const problemId of PROBLEM_IDS) {
            if (rand() < 0.4) continue;
            submissions.push(
                ...attempts(rand, now, student.id, problemId, rand() < 0.8),
            );
        }
    }
    await db.insert(submission).values(submissions);

    // Written scores out of 100 (the app's range), missing the odd test.
    const scores: (typeof writtenTests.$inferInsert)[] = [];
    for (const student of students) {
        const skill = 40 + pick(45);
        for (const season of WRITTEN_SEASONS) {
            for (const [competition, takenAt] of Object.entries(season.dates)) {
                if (rand() < 0.15) continue;
                const score = Math.min(100, Math.max(0, skill + pick(31) - 15));
                scores.push({
                    userId: student.id,
                    competition: competition as Competition,
                    seasonYear: season.year,
                    score,
                    accuracy: Math.round((0.5 + rand() * 0.5) * 100) / 100,
                    takenAt,
                });
            }
        }
    }
    await db.insert(writtenTests).values(scores);

    await db.insert(featureRequest).values(
        FEATURE_REQUESTS.map(({ from, daysAgo, ...request }) => ({
            ...request,
            userId: `seed-${slug(from)}`,
            timeSubmitted: new Date(now.getTime() - daysAgo * 86_400_000),
        })),
    );

    const dev = await insertDevActivity(rand, now);
    const practiceAttempts = await insertPrairieLearnData(rand, now);

    console.log(
        `Added ${SCHOOLS.length} schools, ${users.length} users ` +
            `(${users.length - students.length} teachers), ` +
            `${submissions.length} submissions, ${scores.length} written scores, ` +
            `${FEATURE_REQUESTS.length} feature requests, ` +
            `${dev.submissions} dev account submissions, ` +
            `${dev.runs} dev account runs, and ` +
            `${practiceAttempts} PrairieLearn practice-test attempts.`,
    );
}

if (!devLoginEnabled()) {
    console.error(
        "Refusing to seed: only allowed in development against a database " +
            "listed in DEV_LOGIN_DATABASE_HOSTS.",
    );
    process.exit(1);
}

try {
    await removeDummyData();
    if (!process.argv.includes("--remove")) await insertDummyData();
} finally {
    // drizzle(url) creates a pool; close it so the script exits.
    await db.$client.end();
}
