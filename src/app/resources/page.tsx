import { CourseResourceCard } from "./course-resource-card";
import PastProblems from "./past-problems";

export default function Resources() {
    return (
        <>
            <PastProblems />
            <h2 className="text-primary-foreground my-5 flex-col self-center text-center text-4xl">
                Online Free Courses
            </h2>
            <section className="bg-primary text-primary-foreground relative m-auto h-[45vh] max-w-3/4 items-center justify-center space-y-5 overflow-scroll">
                <CourseResourceCard
                    title={"MIT OCW Intro To Java Programming"}
                    description="An introductory Java course from 2010 - most of the Java we use has been around since longer."
                    href="https://ocw.mit.edu/courses/6-092-introduction-to-programming-in-java-january-iap-2010"
                    tags={["videos", "assignments"]}
                />
                <CourseResourceCard
                    title={"MIT OCW Intro To Algorithms"}
                    description=""
                    href="https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/"
                    tags={["videos", "assignments"]}
                />
                <CourseResourceCard
                    title={"HarvardX CS50 Intro To Computer Science"}
                    description="Gives you a certification if you audit the course. If you start now, you should be done around January."
                    href="https://www.edx.org/learn/computer-science/harvard-university-cs50-s-introduction-to-computer-science"
                    tags={["videos", "assignments"]}
                />
            </section>
        </>
    );
}
