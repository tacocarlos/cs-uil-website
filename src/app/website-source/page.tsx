import { formatDistanceToNow } from "date-fns";
import { GitCommitHorizontal, GitFork, Github, Star } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Footer from "~/components/global/Footer";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
    getReadme,
    getRecentCommits,
    getRepoInfo,
    REPO,
    REPO_URL,
} from "./github";

export const metadata = { title: "Website Source Code" };

// Rebuilt at most hourly, matching the GitHub fetch cache.
export const revalidate = 3600;

export default async function WebsiteSourcePage() {
    const [repo, readme, commits] = await Promise.all([
        getRepoInfo(),
        getReadme(),
        getRecentCommits(),
    ]);

    return (
        <main className="bg-primary min-h-screen">
            {/* ── Header ─────────────────────────────────────────────── */}
            <section className="text-primary-foreground px-4 py-16 text-center">
                <h1 className="mb-4 text-4xl font-bold md:text-5xl">
                    Website Source Code
                </h1>
                <p className="mx-auto mb-2 max-w-2xl text-lg">
                    This site is open source. Read the code, report a bug, or
                    fork it to run a copy for your own team.
                </p>
                <p className="mb-8 font-mono text-sm opacity-80">{REPO}</p>
                <div className="flex flex-wrap justify-center gap-3">
                    <Button asChild size="lg">
                        <a href={REPO_URL} target="_blank" rel="noreferrer">
                            <Github className="mr-2 h-5 w-5" /> View on GitHub
                        </a>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                        <a
                            href={`${REPO_URL}/fork`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-foreground"
                        >
                            <GitFork className="mr-2 h-5 w-5" /> Fork it
                        </a>
                    </Button>
                </div>
                {repo && (
                    <p className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm opacity-80">
                        <span className="inline-flex items-center gap-1">
                            <Star className="h-4 w-4" /> {repo.stars} stars
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <GitFork className="h-4 w-4" /> {repo.forks} forks
                        </span>
                        <span>
                            Updated{" "}
                            {formatDistanceToNow(new Date(repo.pushedAt), {
                                addSuffix: true,
                            })}
                        </span>
                    </p>
                )}
            </section>

            {/* ── README and recent commits ──────────────────────────── */}
            <section className="bg-secondary-50 px-4 py-12">
                <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_22rem]">
                    <Card className="min-w-0">
                        <CardHeader>
                            <CardTitle>README</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {readme ? (
                                <article className="prose prose-sm sm:prose max-w-none break-words">
                                    <Markdown remarkPlugins={[remarkGfm]}>
                                        {readme}
                                    </Markdown>
                                </article>
                            ) : (
                                <Unavailable what="The README" />
                            )}
                        </CardContent>
                    </Card>

                    <Card className="h-fit min-w-0">
                        <CardHeader>
                            <CardTitle>Recent changes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {commits && commits.length > 0 ? (
                                <ol className="space-y-4">
                                    {commits.map((c) => (
                                        <li key={c.sha} className="flex gap-2">
                                            <GitCommitHorizontal className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                                            <div className="min-w-0">
                                                <a
                                                    href={c.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="block truncate text-sm font-medium hover:underline"
                                                    title={c.message}
                                                >
                                                    {c.message}
                                                </a>
                                                <p className="text-muted-foreground text-xs">
                                                    <span className="font-mono">
                                                        {c.sha.slice(0, 7)}
                                                    </span>{" "}
                                                    · {c.author} ·{" "}
                                                    {formatDistanceToNow(
                                                        new Date(c.date),
                                                        { addSuffix: true },
                                                    )}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <Unavailable what="Recent commits" />
                            )}
                            <a
                                href={`${REPO_URL}/commits`}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-4 block text-sm font-medium hover:underline"
                            >
                                Full history →
                            </a>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <Footer />
        </main>
    );
}

function Unavailable({ what }: { what: string }) {
    return (
        <p className="text-muted-foreground text-sm">
            {what} couldn&apos;t be loaded from GitHub right now.{" "}
            <a href={REPO_URL} className="underline">
                See it on GitHub
            </a>
            .
        </p>
    );
}
