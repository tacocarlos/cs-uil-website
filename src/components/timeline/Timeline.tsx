import { Accordion } from "../ui/accordion";
import TimelineEntry, { type TimelineItem } from "./TimelineItem";

export type TimelineProps = {
    events: Omit<TimelineItem, "index">[];
    timelineTitle: string;
    scrollToDesignated?: boolean;
};

export default function Timeline({
    events,
    timelineTitle,
    scrollToDesignated,
}: TimelineProps) {
    return (
        <section className="bg-secondary-50 px-4 py-16">
            <div className="container mx-auto">
                <h2 className="text-primary-foreground mb-12 text-center text-3xl font-bold">
                    {timelineTitle}
                </h2>
                <Accordion
                    type="single"
                    collapsible
                    className="mx-auto max-w-3xl"
                >
                    {events.map((event, index) => {
                        return (
                            <TimelineEntry
                                timelineEvent={{ ...event, index: index }}
                                key={index}
                            />
                        );
                    })}
                </Accordion>
            </div>
        </section>
    );
}

export const DefaultTimelineData: TimelineProps["events"] = [
    {
        date: "October 24th",
        eventName: "TAMU CS Day",
        description:
            "The CS Day schedule is split into a morning session (covering talks on a variety of computing topics) and an afternoon session (covering various hands-on CS activities and demos), with lunch in between. Talks and demos will be happening in parallel sessions.",
    },
    {
        date: "October 30th",
        eventName: "Virtual Challenge Meet #1",
        description:
            "A mock contest, consisting of a written contest and a programming contest. The written test will be submitted against other students in the state. I will create programming problems and pit you against each other (2 teams, probably).",
    },
    {
        date: "November 13th",
        eventName: "Bebras Challenge",
        description:
            "Computational thinking contest - no coding required for this one.",
    },
    {
        date: "November 20th or December 11th",
        eventName: "Virtual Challenge Meet #2",
        description:
            "A mock contest, consisting of a written contest and a programming contest. The written test will be submitted against other students in the state. I will create programming problems and pit you against each other (2 teams, probably).",
    },
    {
        date: "Early to Mid January",
        eventName: "USACO First Contest",
        description: "The first contest in the USACO gauntlet.",
    },
    {
        date: "January 29th",
        eventName: "Virtual Challenge Meet #3",
        description:
            "A mock contest, consisting of a written contest and a programming contest. The written test will be submitted against other students in the state. I will create programming problems and pit you against each other (2 teams, probably).",
    },
    {
        date: "Late Jan. to Early Feb.",
        eventName: "USACO Second Contest",
        description: "The second contest in the USACO gauntlet.",
    },
    {
        date: "February 26th",
        eventName: "Virtual Challenge Meet #4 (District Meet Comparison)",
        description:
            "A mock contest (mimicing the district contest), consisting of a written contest and a programming contest. The written test will be submitted against other students in the state. I will create programming problems and pit you against each other (2 teams, probably).",
    },
    {
        date: "Late February",
        eventName: "USACO Third Contest",
        description: "The first contest in the USACO gauntlet.",
    },
    {
        date: "March 29th",
        eventName: "UIL District Meet",
        description: "UIL District Meet (on a Monday).",
    },
    {
        date: "Late March",
        eventName: "USACO US Open",
        description: "The final contest in USACO, proctored.",
    },
    {
        date: "April 9th",
        eventName: "Virtual Challenge Meet #5 (RQ Meet Comparison)",
        description:
            "A mock contest (mimicing the region contest), consisting of a written contest and a programming contest. The written test will be submitted against other students in the state. I will create programming problems and pit you against each other (2 teams, probably).",
    },
    {
        date: "April 30th",
        eventName: "Virtual Challenge Meet #5 (SQ Meet Comparison)",
        description:
            "A mock contest (mimicing the state contest), consisting of a written contest and a programming contest. The written test will be submitted against other students in the state. I will create programming problems and pit you against each other (2 teams, probably).",
    },
    //     {
    //         date: "October 24th",
    //         eventName: "CS UIL Virtual Challenge #1",
    //         description:
    //             "The CS UIL Virtual Challenge is an online UIL contest consisting of only the written test. In order to replicate the standard UIL environment, I will host the constest during Friday practice at 11:00AM on October 24th.",
    //     },
    //     {
    //         scrollTo: true,
    //         date: "November 14th",
    //         eventName: "Berbas Computing Challenge",
    //         description: `The Berbas Computing Challenge is an online problem solving competition, aimed at algorithmic thinking, but _**does not require any coding.**_ From their website:
    // _The Bebras challenge is designed to help students explorer their talents and passion for informatics and computational thinking with engaging challenges.
    // Participating in the challenge is free and the tasks can all be completed without any preparation or studying.
    // Students from 6 to 18 years old work through a set of tasks that focus on different topics and skills within informatics and computational thinking.
    // They will have 45 minutes to complete as many tasks as they can, they are not expected to finish them all.
    // The challenge has six different age categories with each their own set of tasks to keep things exciting and challenging for all students._
    // `,
    //     },
    //     {
    //         date: "November 14th",
    //         eventName: "CS UIL Virutal Challenge #2",
    //         description:
    //             "The second CS UIL Virtual Challenge, held on November 14th during Friday practice.",
    //     },
    //     {
    //         date: "December",
    //         eventName: "Advent of Code",
    //         description: "An advent calendar of programming problems.",
    //     },
    //     {
    //         date: "December 13th",
    //         eventName: "USA Computing Olympiad - First Contest",
    //         description: "The first contest of USACO.",
    //     },
    //     {
    //         date: "January 16th",
    //         eventName: "UIL Invitational A",
    //         description:
    //             "Invitational A will be held at New Waverly High School, approximately an hour away from GHS.\n\n**Schedule**\n- 1:30ish Leave GHS\n- 2:30 Check In\n- 3:00 Programming Setup\n- 3:30 Written Test\n- 4:30 Programming Test",
    //     },
    //     {
    //         date: "February 10th",
    //         eventName: "UIL Invitational B",
    //         description: ""
    //     },
    //     {
    //         date: "March 26th",
    //         eventName: "UIL District",
    //         description: "UIL District at GHS"
    //     }
];
