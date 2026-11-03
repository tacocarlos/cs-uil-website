import { type CourseResourceCardProps } from "./course-resource-card";

export const OnlineCompetitions: CourseResourceCardProps[] = [
    {
        title: "Codeforces",
        description:
            "One of the largest competitive programming platforms, hosting rated contests several times a week and an extensive problem archive.",
        href: "https://codeforces.com/",
        tags: ["competitive programming", "competitions"],
    },
    {
        title: "Codingame",
        description:
            "Game-based programming challenges, including multiplayer bot competitions where your code competes directly against other players.",
        href: "https://www.codingame.com/home",
        tags: ["competitive programming", "multiplayer", "competitions"],
    },
    {
        title: "Kattis",
        description:
            "A large archive of practice problems. The lower-difficulty problems closely resemble those found on UIL contests.",
        href: "https://open.kattis.com/problems?order=difficulty_data&f_language=en&show_more_filters=on&f_difficulty=0.0-2.4&f_problem_type=-1&f_objective=-1",
        tags: ["competitive programming"],
    },
    {
        title: "CSAcademy",
        description:
            "An archive of interview-style programming problems with an online judge.",
        href: "https://csacademy.com/contest/interview-archive/",
        tags: ["competitive programming"],
    },
    {
        title: "Advent of Code",
        description:
            "A well-known annual programming event held each December, featuring a series of two-part puzzles released leading up to Christmas.",
        href: "https://adventofcode.com/",
        tags: ["competitions"],
    },
    {
        title: "Neetcode (Versus)",
        description:
            "Head-to-head ranked matches using coding interview problems.",
        href: "https://neetcode.io/versus",
        tags: ["multiplayer", "competitive programming"],
    },
];

export const JavaResources: CourseResourceCardProps[] = [
    {
        title: "Java MOOC",
        description:
            "A free, comprehensive online Java course widely regarded as one of the best available. Completing both 'Java Programming I' and 'Java Programming II' provides a strong foundation for advancing to state.",
        href: "https://java-programming.mooc.fi/",
        tags: ["Java"],
    },
    {
        title: "Java API Documentation",
        description:
            "The official reference for the Java standard library. Useful for looking up classes and methods such as those in java.util.",
        href: "https://docs.oracle.com/en/java/javase/26/docs/api/index.html",
        tags: ["Java"],
    },
    {
        title: "Java Learning Roadmap",
        description:
            'A structured overview of Java topics. For UIL preparation, focus on everything through "Collections" along with "Functional Programming"; the remaining topics are geared toward backend development.',
        href: "https://roadmap.sh/java",
        tags: ["Java"],
    },
    {
        title: "CodingBat",
        description:
            "Short Java exercises with instant feedback, well suited for building fluency with strings, arrays, and logic.",
        href: "https://codingbat.com/java",
        tags: ["Java"],
    },
    {
        title: "Derek Banas Java YouTube Playlist",
        description:
            "A thorough video tutorial series on Java. UIL relies on core Java, which has changed little over the years, so the material remains relevant.",
        href: "https://www.youtube.com/watch?v=TBWX97e1E9g&list=PLE7E8B7F4856C9B19",
        tags: ["Java"],
    },
];

export const OnlineCourses: CourseResourceCardProps[] = [
    {
        title: "MIT OCW Intro To Java Programming",
        description:
            "An introductory Java course from MIT (2010). The core Java features it covers are the same ones used in UIL today.",
        href: "https://ocw.mit.edu/courses/6-092-introduction-to-programming-in-java-january-iap-2010",
        tags: ["videos", "assignments"],
    },
    {
        title: "MIT OCW Intro To Algorithms",
        description:
            "MIT's introductory algorithms course, covering fundamental data structures, sorting, graph algorithms, and dynamic programming.",
        href: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
        tags: ["videos", "assignments"],
    },
    {
        title: "HarvardX CS50 Intro To Computer Science",
        description:
            "Harvard's renowned introduction to computer science. The course is free to audit and offers a certificate upon completion.",
        href: "https://www.edx.org/learn/computer-science/harvard-university-cs50-s-introduction-to-computer-science",
        tags: ["videos", "assignments"],
    },
    {
        title: "TheCherno C++ YouTube Playlist",
        description:
            "A comprehensive video series on C++, covering both language fundamentals and how the code works under the hood.",
        href: "https://www.youtube.com/watch?v=18c3MTX0PK0&list=PLlrATfBNZ98dudnM48yfGUldqGD0S4FFb",
        tags: ["videos"],
    },
];

export const OnlinePaidCourses: CourseResourceCardProps[] = [
    {
        title: "Neetcode",
        description:
            "A learning platform for coding interview preparation. Although aimed at college students seeking internships and jobs, much of the content covers fundamental data structures and algorithms that apply directly to competitive programming.",
        href: "https://neetcode.io/",
        tags: ["exercises", "articles", "videos"],
    },
];

export const CSYoutubeChannels: CourseResourceCardProps[] = [
    {
        title: "Tsoding",
        description:
            "Live programming sessions focused on low-level development and building applications from scratch with minimal abstractions.",
        href: "https://www.youtube.com/@TsodingDaily",
        tags: ["videos"],
    },
    {
        title: "You Suck At Programming",
        description:
            "Covers a wide range of programming and Linux concepts, with a focus on shell scripting and the command line.",
        href: "https://www.youtube.com/@yousuckatprogramming",
        tags: ["videos"],
    },
    {
        title: "Computerphile",
        description:
            "University professors and industry professionals discuss a wide variety of computer science topics. Tom Scott's video on handling time zones in software is a notable example.",
        href: "https://www.youtube.com/@Computerphile/videos",
        tags: ["videos"],
    },
    {
        title: "The 8-Bit Guy",
        description:
            "Retro computing content that demonstrates how computers work at a fundamental, hardware level.",
        href: "https://www.youtube.com/@The8BitGuy",
        tags: ["videos"],
    },
    {
        title: "Stuff Made Here",
        description:
            "Ambitious engineering projects that combine mechanical design, electronics, and software to solve unusual problems.",
        href: "https://www.youtube.com/@StuffMadeHere",
        tags: ["videos"],
    },
    {
        title: "SethBling",
        description:
            "Technical Minecraft builds and video game exploits, including the arbitrary code execution route used in Super Mario World speedruns.",
        href: "https://www.youtube.com/@SethBling/videos",
        tags: ["videos"],
    },
    {
        title: "RetroGameMechanicsExplained",
        description:
            "In-depth explanations of how classic video games work, often examining the original assembly code to explain game mechanics.",
        href: "https://www.youtube.com/@RGMechEx",
        tags: ["videos"],
    },
    {
        title: "Michael Reeves",
        description:
            "Comedic robotics and software projects that show programming applied to hardware in creative ways.",
        href: "https://www.youtube.com/@MichaelReeves",
        tags: ["videos"],
    },
    {
        title: "MattKC",
        description:
            "Reverse engineering and technical investigations of games and hardware, most notably the Wii U GamePad and LEGO Island.",
        href: "https://www.youtube.com/@MattKC",
        tags: ["videos"],
    },
    {
        title: "Masahiro Sakurai",
        description:
            "The creator of Kirby and Super Smash Bros. shares his approach to game design and development.",
        href: "https://www.youtube.com/@sora_sakurai_en",
        tags: ["videos"],
    },
    {
        title: "LiveOverflow",
        description:
            "Cybersecurity content covering topics such as exploitation, reverse engineering, and capture-the-flag challenges.",
        href: "https://www.youtube.com/@LiveOverflow",
        tags: ["videos"],
    },
    {
        title: "LGR",
        description:
            "Retro computing content focused on hardware and software from the 1980s through the early 2000s.",
        href: "https://www.youtube.com/@LGR",
        tags: ["videos"],
    },
    {
        title: "Displaced Gamers",
        description:
            "Technical deep dives into classic video game code and mechanics, presented in an approachable format.",
        href: "https://www.youtube.com/@DisplacedGamers",
        tags: ["videos"],
    },
    {
        title: "CppCon Talk Archive",
        description:
            "Recorded talks from CppCon, the annual C++ conference. Aimed at professional C++ developers, so many talks are advanced.",
        href: "https://www.youtube.com/@CppCon/videos",
        tags: ["videos", "C++"],
    },
    {
        title: "Ben Eater",
        description:
            "Exceptionally clear videos on computer hardware, including building a working computer from basic electronic components.",
        href: "https://www.youtube.com/@BenEater",
        tags: ["videos"],
    },
    {
        title: "3Blue1Brown",
        description:
            "Visually driven explanations of mathematics, along with several excellent videos on computer science topics such as neural networks.",
        href: "https://www.youtube.com/@3blue1brown",
        tags: ["videos"],
    },
];
