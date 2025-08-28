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
        <h2 className="mb-12 text-center text-3xl font-bold text-blue-900">
          {timelineTitle}
        </h2>
        <Accordion type="single" collapsible className="mx-auto max-w-3xl">
          {events.map((event, index) => {
            return (
              <TimelineEntry event={{ ...event, index: index }} key={index} />
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
    eventName: "CS UIL Virutal Challenge #2",
    description: "The second CS UIL Virtual Challenge, held on November 14th during Friday practice."
  },
  {
    date: "December",
    eventName: "Advent of Code",
    description: "An advent calendar of programming problems."
  },
  {
    date: "December 13th",
    eventName: "USA Computing Olympiad - First Contest",
    description: "The first contest of USACO."
  }
];
