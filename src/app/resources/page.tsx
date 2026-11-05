import {
    CourseResourceCard,
    type CourseResourceCardProps,
} from "./course-resource-card";
import {
    CSYoutubeChannels,
    JavaResources,
    OnlineCompetitions,
    OnlineCourses,
    OnlinePaidCourses,
    Tools,
} from "./resources";
import ResourcesHero from "./resources-hero";

const SECTIONS: {
    id: string;
    title: string;
    resources: CourseResourceCardProps[];
}[] = [
    {
        id: "online-competitions",
        title: "Online Competitions",
        resources: OnlineCompetitions,
    },
    {
        id: "java",
        title: "Java Specific Resources",
        resources: JavaResources,
    },
    {
        id: "free-courses",
        title: "Online Free Courses",
        resources: OnlineCourses,
    },
    {
        id: "paid-courses",
        title: "Online Paid Courses",
        resources: OnlinePaidCourses,
    },
    {
        id: "youtube",
        title: "Computer Science YouTube Channels",
        resources: CSYoutubeChannels,
    },
    { id: "tools", title: "Tools", resources: Tools },
];

function ResourceSection({
    id,
    title,
    resources,
    shaded,
}: {
    id: string;
    title: string;
    resources: CourseResourceCardProps[];
    shaded: boolean;
}) {
    return (
        <section
            id={id}
            // Clears the fixed navbar when jumped to from the hero.
            className={`scroll-mt-20 border-t py-14 ${shaded ? "bg-muted/40" : ""}`}
        >
            <div className="mx-auto max-w-5xl px-6">
                <h2 className="mb-8 flex items-baseline gap-3 text-3xl font-bold">
                    {title}
                    <span className="text-muted-foreground text-base font-normal">
                        {resources.length}
                    </span>
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {resources.map((course) => (
                        <CourseResourceCard key={course.href} {...course} />
                    ))}
                </div>
            </div>
        </section>
    );
}

export default function ResourcesPage() {
    return (
        <>
            <ResourcesHero sections={SECTIONS} />
            {SECTIONS.map((s, i) => (
                <ResourceSection key={s.id} {...s} shaded={i % 2 === 1} />
            ))}
        </>
    );
}
