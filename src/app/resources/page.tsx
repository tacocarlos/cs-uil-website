import ResourcesSummary from "~/components/resources/ResourcesSummary";
import {
    CourseResourceCard,
    type CourseResourceCardProps,
} from "./course-resource-card";
import PastProblems from "./past-problems";
import { JavaResources, OnlineCompetitions, OnlineCourses } from "./resources";

function ResourceSection({
    sectionHeader,
    resources,
}: {
    sectionHeader: string;
    resources: CourseResourceCardProps[];
}) {
    return (
        <section className="bg-primary text-primary-foreground py-16">
            <div className="mx-auto max-w-5xl px-6">
                <h2 className="mb-10 text-center text-4xl font-bold">
                    {sectionHeader}
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {resources.map((course, idx) => (
                        <CourseResourceCard key={idx} {...course} />
                    ))}
                </div>
            </div>
        </section>
    );
}

export default function Resources() {
    return (
        <>
            <PastProblems />
            <ResourceSection
                sectionHeader="Online Competitions"
                resources={OnlineCompetitions}
            />
            <ResourceSection
                sectionHeader="Java Specific Resources"
                resources={JavaResources}
            />
            <ResourceSection
                sectionHeader="Online Free Courses"
                resources={OnlineCourses}
            />
        </>
    );
}
