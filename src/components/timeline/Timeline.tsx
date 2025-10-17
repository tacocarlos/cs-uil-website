import { Accordion } from "../ui/accordion";
import TimelineEntry, { type TimelineItem } from "./TimelineItem";

export type TimelineProps = {
    events: Omit<TimelineItem, "index">[];
    timelineTitle: string;
};

export default function Timeline({ events, timelineTitle }: TimelineProps) {
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
        eventName: "CS UIL Virtual Challenge #1",
        description:
            "The CS UIL Virtual Challenge is an online UIL contest consisting of only the written test. In order to replicate the standard UIL environment, I will host the constest during Friday practice at 11:00AM on October 24th.",
    },
    {
        date: "November 14th",
        eventName: "Berbas Computing Challenge",
        description: `The Berbas Computing Challenge is an online problem solving competition, aimed at algorithmic thinking, but _**does not require any coding.**_ From their website:

_The Bebras challenge is designed to help students explorer their talents and passion for informatics and computational thinking with engaging challenges.
Participating in the challenge is free and the tasks can all be completed without any preparation or studying.
Students from 6 to 18 years old work through a set of tasks that focus on different topics and skills within informatics and computational thinking.
They will have 45 minutes to complete as many tasks as they can, they are not expected to finish them all.
The challenge has six different age categories with each their own set of tasks to keep things exciting and challenging for all students._
`,
    },
    {
        date: "November 14th",
        eventName: "CS UIL Virutal Challenge #2",
        description:
            "The second CS UIL Virtual Challenge, held on November 14th during Friday practice.",
    },
    {
        date: "December",
        eventName: "Advent of Code",
        description: "An advent calendar of programming problems.",
    },
    {
        date: "December 13th",
        eventName: "USA Computing Olympiad - First Contest",
        description: "The first contest of USACO.",
    },
    {
        date: "January 16th",
        eventName: "UIL Invitational A",
        description:
            "Invitational A will be held at New Waverly High School, approximately an hour away from GHS.\n\n**Schedule**\n- 1:30ish Leave GHS\n- 2:30 Check In\n- 3:00 Programming Setup\n- 3:30 Written Test\n- 4:30 Programming Test",
    },
    {
        date: "February 10th",
        eventName: "UIL Invitational B",
        description: `Invitational B will be held at Livingston High School, approximately an hour away from GHS.

**Schedule**
  - Probably leave around 6:00 AM
      `,
    },
];
