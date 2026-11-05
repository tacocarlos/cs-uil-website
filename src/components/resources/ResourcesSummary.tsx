import Link from "next/link";

export type ResourceItemType = {
    title: string;
    description: string;
    href: string;
};

export default function ResourcesSummary() {
    return (
        <section className="px-4 py-16">
            <div className="container mx-auto">
                <h2 className="mb-12 text-center text-3xl font-bold">
                    Preparation Resources (Under Construction)
                </h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[
                        {
                            title: "Practice Problems",
                            description:
                                "Access previous years' competition problems",
                            link: "/resources/past-problem",
                        },
                        {
                            title: "Study Guides",
                            description:
                                "Comprehensive guides for all CS UIL categories",
                            link: "/resources/guides",
                        },
                        {
                            title: "Video Tutorials",
                            description:
                                "Step-by-step tutorials for common algorithms",
                            link: "/resources/tutorials",
                        },
                    ].map((resource, index) => (
                        <div
                            // href={resource.link}
                            key={index}
                            className="border-l-primary bg-card text-card-foreground rounded-lg border border-l-4 p-6 shadow-md transition-shadow hover:shadow-lg"
                        >
                            <p className="mb-2 text-lg font-bold">
                                {resource.title}
                            </p>
                            <p className="text-muted-foreground mb-3">
                                {resource.description}
                            </p>
                            <span className="font-medium">Learn more →</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
