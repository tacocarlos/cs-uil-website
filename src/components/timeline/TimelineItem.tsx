import {
    AccordionItem,
    AccordionContent,
    AccordionTrigger,
} from "../ui/accordion";
import rehypeMathJax from "rehype-mathjax";
import remarkGfm from "remark-gfm";
import Markdown from "react-markdown";
import remarkMath from "remark-math";

export type TimelineItem = Readonly<{
    date: string;
    eventName: string;
    description: string;
    important?: boolean;
    index?: number | string;
}>;

export default function TimelineEntry({ event }: { event: TimelineItem }) {
    const idx = (event.index ?? event.eventName).toString();
    return (
        <AccordionItem
            value={idx}
            key={idx}
            className="bg-secondary mb-8 flex-col rounded-lg p-6 pb-2 shadow-md"
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
