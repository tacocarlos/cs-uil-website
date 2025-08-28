import {
  AccordionItem,
  AccordionContent,
  AccordionTrigger,
} from "../ui/accordion";
export default function TimelineItem({
  name,
  date,
  event,
  description,
  index,
}: {
  name: string;
  date: string;
  event: string;
  description?: string;
  index?: string | number;
}) {
  return (
    <AccordionItem
      value={(index ?? name).toString()}
      key={index}
      className="mb-8 flex-col rounded-lg bg-white p-6 shadow-md"
    >
      <AccordionTrigger>
        <div className="mb-2 font-bold text-blue-700 md:mb-0">{date}</div>
        <div className="">
          <h3 className="text-left text-lg font-bold">{event}</h3>
        </div>
      </AccordionTrigger>

      <AccordionContent>
        <p className="text-gray-600">{description}</p>
      </AccordionContent>
    </AccordionItem>
  );
}
