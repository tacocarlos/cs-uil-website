import { type CourseResourceCardProps } from "./course-resource-card";

export const OnlineCompetitions: CourseResourceCardProps[] = [
    {
        title: "Codeforces",
        description: "",
        href: "https://codeforces.com/",
        tags: ["competitive programming", "competitions"],
    },
    {
        title: "Codingame",
        description: "",
        href: "https://www.codingame.com/home",
        tags: ["competitive programming", "multiplayer", "competitions"],
    },
    {
        title: "Kattis",
        description:
            "Online practice problems. The easier difficulty problems are similar to the UIL problems.",
        href: "https://open.kattis.com/problems?order=difficulty_data&f_language=en&show_more_filters=on&f_difficulty=0.0-2.4&f_problem_type=-1&f_objective=-1",
        tags: ["competitive programming"],
    },
    {
        title: "CSAcademy",
        description: "",
        href: "https://csacademy.com/contest/interview-archive/",
        tags: ["competitive programming"],
    },
];

export const JavaResources: CourseResourceCardProps[] = [
    {
        title: "Java API Documentation",
        description: "",
        href: "https://docs.oracle.com/en/java/javase/26/docs/api/index.html",
        tags: ["Java"],
    },
    {
        title: "Java Learning Roadmap",
        description:
            'For UIL purposes, I would stop after getting to "Collections", skip to "Functional Programming" and then stop. Everything else is more suited for backend web development.',
        href: "https://roadmap.sh/java",
        tags: ["Java"],
    },
    {
        title: "CodingBat",
        description: "",
        href: "https://codingbat.com/java",
        tags: ["Java"],
    },
];

export const OnlineCourses: CourseResourceCardProps[] = [
    {
        title: "MIT OCW Intro To Java Programming",
        description:
            "An introductory Java course from 2010 - most of the Java we use has been around since longer.",
        href: "https://ocw.mit.edu/courses/6-092-introduction-to-programming-in-java-january-iap-2010",
        tags: ["videos", "assignments"],
    },
    {
        title: "MIT OCW Intro To Algorithms",
        description: "",
        href: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
        tags: ["videos", "assignments"],
    },
    {
        title: "HarvardX CS50 Intro To Computer Science",
        description:
            "Gives you a certification if you audit the course. If you start now, you should be done around January.",
        href: "https://www.edx.org/learn/computer-science/harvard-university-cs50-s-introduction-to-computer-science",
        tags: ["videos", "assignments"],
    },
];
