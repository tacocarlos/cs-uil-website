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
    {
        title: "Advent of Code",
        description:
            "High profile annual coding event, (as of 2025) providing a two-part programming problem every other day in December, until Christmas. ",
        href: "https://adventofcode.com/",
        tags: ["christmas"],
    },
    {
        title: "Neetcode (Versus)",
        description: "1v1 Ranked Coding Interview problems.",
        href: "https://neetcode.io/versus",
        tags: ["multiplayer", "competitive programming"],
    },
];

export const JavaResources: CourseResourceCardProps[] = [
    {
        title: "Java MOOC",
        description:
            "Online Java course, considered the gold standard. If you do both 'Java Programming I' and 'Java Programming II', you should have no issue getting to state in our region.",
        href: "https://java-programming.mooc.fi/",
        tags: ["Java"],
    },
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
    {
        title: "Derek Banas Java Youtube Playlist",
        description:
            'Great video tutorial that taught me Java back in HS. UIL only really uses "core" Java, which hasn\'t changed in a long time, so still applicable.',
        href: "https://www.youtube.com/watch?v=TBWX97e1E9g&list=PLE7E8B7F4856C9B19",
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
    {
        title: "TheCherno C++ Youtube Playlist",
        description: "",
        href: "https://www.youtube.com/watch?v=18c3MTX0PK0&list=PLlrATfBNZ98dudnM48yfGUldqGD0S4FFb",
        tags: ["videos"],
    },
];

export const OnlinePaidCourses: CourseResourceCardProps[] = [
    {
        title: "Neetcode",
        description:
            'Learning platform for studying for coding interviews. Meant for college upperclassmen who are looking for jobs/interviews, but most of the content isn\'t the difficult part of CS. If you can prove basic programming and problem solving ability, I will gladly buy you lifetime "Pro".',
        href: "https://neetcode.io/",
        tags: ["exercises", "articles", "videos"],
    },
];

export const CSYoutubeChannels: CourseResourceCardProps[] = [
    {
        title: "Tsoding",
        description:
            "Russian programmer who loves low-level programming, mostly focused on 'simple' (no abstractions) applications",
        href: "",
        tags: ["videos"],
    },
    {
        title: "You Suck At Programming",
        description:
            "Linux based channel covering a wide range of concepts. Generally a good time.",
        href: "",
        tags: ["videos"],
    },
    {
        title: "Computerphile",
        description:
            "An offshoot of the channel Numberphile, has university professors and industry professionals talk about stuff they think is interesting. Tom Scott's video about the implementation of Time Zones in applicaitons is a pretty good one, like all Tom Scott videos.",
        href: "https://www.youtube.com/@Computerphile/videos",
        tags: ["videos"],
    },
    {
        title: "T3 Theo",
        description:
            "Web dev guy. Not a fan of his philosophy towards computer science ('build a product' ideology, not a 'beauty of problem solving' ideology), but the videos are fun to watch. Tsoding would likely describe him as having a severe case of 'Web Dev Disease'.",
        href: "https://www.youtube.com/@t3dotgg",
        tags: ["videos"],
    },
    {
        title: "The 8-Bit Guy",
        description:
            "Old head who loves retro computing. Really drives home how computers are not magical devices and just a box that electricity runs through.",
        href: "https://www.youtube.com/@The8BitGuy",
        tags: ["videos"],
    },
    {
        title: "Stuff Made Here",
        description:
            "Engineer who builds things. While he doesn't really talk about software that much compared to his early videos, still really cool videos.",
        href: "https://www.youtube.com/@StuffMadeHere",
        tags: ["videos"],
    },
    {
        title: "SpiritOfTheLaw",
        description:
            "Not related to CS at all, I just love Age of Empires 2. Even built a Discord bot to notify when he uploaded.",
        href: "https://www.youtube.com/@SpiritOfTheLaw",
        tags: ["videos", "AOE2"],
    },
    {
        title: "SethBling",
        description:
            "Does truly crazy stuff in Minecraft, and hasn't missed in the 11(?) years I've watched him. Also discovered the current WR route in Any% Super Mario World using Arbitrary Code Execution.",
        href: "https://www.youtube.com/@SethBling/videos",
        tags: ["videos"],
    },
    {
        title: "RetroGameMechanicsExplained",
        description:
            "Goes in-depth on explaining retro game mechanics. Like, looking at the actual assembly code to see how power-ups work in Super Mario World. One of my favorite channels.",
        href: "https://www.youtube.com/@RGMechEx",
        tags: ["videos"],
    },
    {
        title: "NHRL",
        description:
            "Not CS-related, but NHRL is the National Havoc Robot League, what is probably the largest Combat Robotics league.",
        href: "https://www.youtube.com/@NHRL",
        tags: ["videos"],
    },
    {
        title: "Michael Reeves",
        description: "Philipino man who builds cool robots.",
        href: "https://www.youtube.com/@MichaelReeves",
        tags: ["videos"],
    },
    {
        title: "MattKC",
        description: "Foremost expert on the Wii U Gamepad and Lego Island.",
        href: "https://www.youtube.com/@MattKC",
        tags: ["videos"],
    },
    {
        title: "Masahiro Sakurai",
        description:
            "Creator and director of Kirby and Super Smash Bros. created a series where he described his game development ideology, amongst other things.",
        href: "https://www.youtube.com/@sora_sakurai_en",
        tags: ["videos"],
    },
    {
        title: "LiveOverflow",
        description: "Cybersecurity focused channel.",
        href: "https://www.youtube.com/@LiveOverflow",
        tags: ["videos"],
    },
    {
        title: "LGR",
        description:
            "Retro computing channel, focused on stuff from the 90s and early 200s, when 'modern' computing got started.",
        href: "https://www.youtube.com/@LGR",
        tags: ["videos"],
    },
    {
        title: "Displaced Gamers",
        description:
            "Channel similar to RGMEx, doing deep dives into game mechanics. Tries to be a bit more accessible to the average viewer.",
        href: "https://www.youtube.com/@DisplacedGamers",
        tags: ["videos"],
    },
    {
        title: "CPPCon Talk Archive",
        description:
            "Archive of past CPPCon (C++ Convention) talks. Sometimes informative, but since it's aimed at C++ developers, the talks aren't very accessible to high schoolers.",
        href: "https://www.youtube.com/@CppCon/videos",
        tags: ["videos", "C++"],
    },
    {
        title: "Ben Eater",
        description:
            "Hardware engineering videos. Some of the greatest informational videos on Youtube to have ever been viewed at the Texas A&M Southside Dining Hall back-left corner by the window near that weird little alcove.",
        href: "https://www.youtube.com/@BenEater",
        tags: ["videos"],
    },
    {
        title: "3Blue1Brown",
        description:
            "While mostly focused on math, he has some excellent videos on CS topics. Quite possibly the greatest to ever do it.",
        href: "https://www.youtube.com/@3blue1brown",
        tags: ["videos"],
    },
    {
        title: "LinusCatTips",
        description: "Cats.",
        href: "https://www.youtube.com/@LinusCatTips/videos",
        tags: ["videos"],
    },
];
