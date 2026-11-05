"use client";
import {
    AccordionItem,
    AccordionContent,
    AccordionTrigger,
} from "../ui/accordion";
import rehypeMathJax from "rehype-mathjax";
import remarkGfm from "remark-gfm";
import Markdown from "react-markdown";
import remarkMath from "remark-math";
import { useRef, useEffect } from "react";

export type TimelineItem = Readonly<{
    date: string;
    eventName: string;
    description: string;
    important?: boolean;
    index?: number | string;
    scrollTo?: boolean;
    /** Only shown to members whose active organization is this one, e.g. `DEFAULT_ORGANIZATION.id`. */
    organizationId?: string;
}>;

export default function TimelineEntry({
    timelineEvent,
}: {
    timelineEvent: TimelineItem;
}) {
    const event = timelineEvent;
    const idx = (event.index ?? event.eventName).toString();
    const scrollableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (event.scrollTo && scrollableRef.current) {
            const curr = scrollableRef?.current;
            if (curr === null) {
                alert("did not have ref");
            }

            curr.scrollIntoView({ behavior: "smooth" });
            // curr.className += "motion-preset-shake motion-duration-500";
            curr.className += "animate-shake animate-duration-500";
        }
    }, [event]);

    return (
        <AccordionItem
            value={idx}
            key={idx}
            className="bg-card text-card-foreground mb-8 flex-col rounded-lg border p-6 pb-2 shadow-md"
            ref={scrollableRef}
        >
            <AccordionTrigger>
                {/* A fixed-width date column, so every title starts at the
                    same place; stacked on small screens. */}
                <div className="flex flex-1 flex-col gap-1 md:flex-row md:items-baseline md:gap-6">
                    <div
                        className={`shrink-0 font-bold md:w-44 ${event.important ? "text-success" : "text-info"}`}
                    >
                        {event.date}
                    </div>
                    <h3 className="text-left text-lg font-bold">
                        {event.eventName}
                    </h3>
                </div>
            </AccordionTrigger>

            <AccordionContent>
                <Markdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeMathJax]}
                >
                    {event.description}
                </Markdown>
                {/* <p className="text-muted-foreground">{event.description}</p> */}
            </AccordionContent>
        </AccordionItem>
    );
}
