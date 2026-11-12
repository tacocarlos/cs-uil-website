import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";
export type ResourceSectionLink = { id: string; title: string };

/** The page's one banner: the site's own practice first, then a jump list. */
export default function ResourcesHero({
    sections,
}: {
    sections: ResourceSectionLink[];
}) {
    return (
        <section className="bg-primary text-primary-foreground pt-28 pb-16">
            <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 text-center">
                <h1 className="text-4xl font-bold">Resources</h1>
                <p className="text-primary-foreground/80 max-w-2xl text-lg">
                    Practice with past UIL problems and contests here, or learn
                    more with the outside courses, judges and channels below.
                </p>
                <div className="flex w-full flex-col justify-center gap-3 sm:flex-row">
                    <Button variant="outline" asChild effect="expandIcon" icon={ArrowRight} iconPlacement="right">
                        <Link
                            href="/resources/past-problem"
                            className="bg-highlight text-highlight-foreground hover:text-highlight-foreground hover:bg-highlight/90 inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 font-medium shadow-md transition-colors"
                        >
                            Past UIL Programming Problems
                        </Link>
                    </Button>
                    <Button variant="outline" asChild effect="expandIcon" icon={ArrowRight} iconPlacement="right">
                        <Link
                            href="/contest"
                            className="border-primary-foreground/40 hover:text-primary-foreground hover:bg-primary-foreground/10 inline-flex items-center justify-center rounded-md border px-6 py-3 font-medium transition-colors"
                        >
                            Practice Contests
                        </Link>
                    </Button>
                </div>
                <nav
                    aria-label="Resource sections"
                    className="flex flex-wrap justify-center gap-2 pt-2"
                >
                    {sections.map((s) => (
                        <a
                            key={s.id}
                            href={`#${s.id}`}
                            className="bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-full px-3 py-1 text-sm transition-colors"
                        >
                            {s.title}
                        </a>
                    ))}
                </nav>
            </div>
        </section>
    );
}
