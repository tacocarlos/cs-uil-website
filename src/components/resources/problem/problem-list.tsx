"use client";

import { Accordion } from "~/components/ui/accordion";
import { ProblemAccordionItem } from "./problem-accordion-item";
import { type Problem } from "~/server/db/schema/types";

export default function ProblemList({
  problems,
  className,
}: {
  problems: Problem[];
  className?: string;
}) {
  return (
    <Accordion
      type="multiple"
      className={`mx-auto max-w-3xl ${className ?? ""}`}
    >
      {problems.map((problem) => (
        <ProblemAccordionItem key={problem.id} problem={problem} />
      ))}
    </Accordion>
  );
}
