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
            className="bg-secondary mb-8 flex-col rounded-lg p-6 pb-2 shadow-md"
            ref={scrollableRef}
        >
            <AccordionTrigger>
                <div
                    className={`mb-2 font-bold text-blue-700 md:mb-0 ${event.important ? "text-green-500" : ""}`}
                >
                    {event.date}
                </div>
                <div className="">
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
                {/* <p className="text-gray-600">{event.description}</p> */}
            </AccordionContent>
        </AccordionItem>
    );
}
