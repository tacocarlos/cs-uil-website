/**
 * Read-only data about this site's public GitHub repository, for the
 * /website-source page. Unauthenticated, so GitHub allows ~60 requests an
 * hour per server IP; responses are cached for an hour to stay well under.
 * Every helper returns null on failure so the page still renders.
 */

export const REPO = "tacocarlos/cs-uil-website";
export const REPO_URL = `https://github.com/${REPO}`;

const API_BASE = `https://api.github.com/repos/${REPO}`;

const CACHE_OPTS: RequestInit = {
    headers: { Accept: "application/vnd.github+json" },
    next: { revalidate: 3600 },
};

export type RepoInfo = {
    description: string | null;
    defaultBranch: string;
    stars: number;
    forks: number;
    pushedAt: string;
};

export type Commit = {
    sha: string;
    message: string;
    author: string;
    date: string;
    url: string;
};

async function getJson<T>(path: string): Promise<T | null> {
    try {
        const res = await fetch(`${API_BASE}${path}`, CACHE_OPTS);
        if (!res.ok) return null;
        return (await res.json()) as T;
    } catch {
        return null;
    }
}

export async function getRepoInfo(): Promise<RepoInfo | null> {
    const repo = await getJson<{
        description: string | null;
        default_branch: string;
        stargazers_count: number;
        forks_count: number;
        pushed_at: string;
    }>("");
    if (!repo) return null;
    return {
        description: repo.description,
        defaultBranch: repo.default_branch,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        pushedAt: repo.pushed_at,
    };
}

/** The README's Markdown source. */
export async function getReadme(): Promise<string | null> {
    const readme = await getJson<{ content: string; encoding: string }>(
        "/readme",
    );
    if (readme?.encoding !== "base64") return null;
    return Buffer.from(readme.content, "base64").toString("utf8");
}

export async function getRecentCommits(count = 8): Promise<Commit[] | null> {
    const commits = await getJson<
        {
            sha: string;
            html_url: string;
            commit: { message: string; author: { name: string; date: string } };
        }[]
    >(`/commits?per_page=${count}`);
    return (
        commits?.map((c) => ({
            sha: c.sha,
            // Just the subject line.
            message: c.commit.message.split("\n")[0] ?? "",
            author: c.commit.author.name,
            date: c.commit.author.date,
            url: c.html_url,
        })) ?? null
    );
}
