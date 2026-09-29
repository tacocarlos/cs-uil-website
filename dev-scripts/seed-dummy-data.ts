/**
 * Fills a dev database with dummy schools, students, teachers, practice
 * submissions, and written test scores, for trying out leaderboards and the
 * school filters.
 *
 *   bun run db:seed            # replace any previous dummy data
 *   bun run db:seed --remove   # just delete it
 *
 * Refuses to run unless dev login is allowed for this database (development,
 * and DATABASE_URL's host is on DEV_LOGIN_DATABASE_HOSTS), so it can't touch
 * production. Dummy users have @seed.local emails and dummy schools have
 * IDs starting with "seed-"; everything else is left alone. The dummy users
 * can't sign in; use the dev accounts for that (they're in Groveton, along
 * with some dummy students).
 */
import { like } from "drizzle-orm";
import { type Pool } from "pg";
import { devLoginEnabled } from "~/lib/auth/dev-login";
import {
    DEFAULT_ORGANIZATION,
    type MemberRole,
} from "~/lib/auth/organizations";
import { type Conference } from "~/lib/schools";
import { db } from "~/server/db";
import { user } from "~/server/db/schema/auth";
import { member, organization } from "~/server/db/schema/organization";
import { submission } from "~/server/db/schema/submission";
import { writtenTests } from "~/server/db/schema/written";

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
};

const GROVETON = DEFAULT_ORGANIZATION.id;

const PEOPLE: Person[] = [
    // Groveton, alongside the dev accounts
    { name: "Ada Lovelace", schools: [GROVETON], global: true },
    // Hidden from every leaderboard.
    { name: "Alan Turing", schools: [GROVETON], showScores: false },
    { name: "Grace Hopper", schools: [GROVETON], global: true },
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

const MAX_POINTS = 60;
/** UIL programming: 5 points off per rejected attempt. */
const PENALTY = 5;

/** Written tests per season, with a representative date for each. */
const WRITTEN_SEASONS: { year: number; dates: Record<string, string> }[] = [
    {
        year: 2026,
        dates: {
            "VCM-1": "2025-10-18",
            "VCM-2": "2025-11-15",
            invA: "2026-01-24",
            district: "2026-03-28",
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
    // Memberships, submissions, and scores cascade from users and schools.
    const users = await db
        .delete(user)
        .where(like(user.email, `%@${EMAIL_DOMAIN}`))
        .returning({ id: user.id });
    const schools = await db
        .delete(organization)
        .where(like(organization.id, `${SCHOOL_ID_PREFIX}%`))
        .returning({ id: organization.id });
    console.log(
        `Removed ${users.length} dummy users and ${schools.length} dummy schools.`,
    );
}

async function insertDummyData() {
    const now = new Date();
    const rand = random(2027);
    const pick = (max: number) => Math.floor(rand() * max);

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
            const attempts = 1 + pick(4);
            const solved = rand() < 0.8;
            for (let attempt = 1; attempt <= attempts; attempt++) {
                const accepted = solved && attempt === attempts;
                submissions.push({
                    problemId,
                    userId: student.id,
                    // Spread over the last 60 days.
                    timeSubmitted: new Date(
                        now.getTime() - pick(60 * 24 * 60) * 60_000,
                    ),
                    points: accepted
                        ? Math.max(MAX_POINTS - PENALTY * (attempt - 1), 0)
                        : 0,
                    maxPoints: MAX_POINTS,
                    accepted,
                    attemptNumber: attempt,
                    submittedCode:
                        "public class Main {\n    public static void main(String[] args) {\n        // dummy submission\n    }\n}\n",
                });
            }
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

    console.log(
        `Added ${SCHOOLS.length} schools, ${users.length} users ` +
            `(${users.length - students.length} teachers), ` +
            `${submissions.length} submissions, and ${scores.length} written scores.`,
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
    await (db.$client as Pool).end();
}
