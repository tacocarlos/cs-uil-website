import { AccordionContent, AccordionItem } from "@radix-ui/react-accordion";
import Link from "next/link";
import Footer from "~/components/global/Footer";
import Hero from "~/components/global/Hero";
import ResourcesSummary from "~/components/resources/ResourcesSummary";
import { Accordion, AccordionTrigger } from "~/components/ui/accordion";

export default function Home() {
  return (
    <main className="from-primary to-secondary min-h-screen bg-gradient-to-b">
      {/* Hero Section */}
      <Hero />

      {/* Competition Timeline */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="container mx-auto">
          <h2 className="mb-12 text-center text-3xl font-bold text-blue-900">
            2025-2026 Competition Timeline
          </h2>
          <Accordion type="single" collapsible className="mx-auto max-w-3xl">
            {[
              {
                date: "November 2025",
                event: "Invitational Meets",
                description:
                  "First round of invitational competitions to prepare for district.",
              },
              {
                date: "February 2026",
                event: "District Competitions",
                description:
                  "Qualify for regionals by competing at the district level.",
              },
              {
                date: "April 2026",
                event: "Regional Competitions",
                description: "Top teams advance to the state competition.",
              },
              {
                date: "May 2026",
                event: "State Competition",
                description:
                  "The best CS UIL teams across Texas compete for state championships.",
              },
            ].map((event, index) => (
              <AccordionItem
                value={index.toString()}
                key={index}
                className="mb-8 flex-col rounded-lg bg-white p-6 shadow-md"
              >
                <AccordionTrigger>
                  <div className="mb-2 font-bold text-blue-700 md:mb-0">
                    {event.date}
                  </div>
                  <div className="">
                    <h3 className="text-left text-lg font-bold">
                      {event.event}
                    </h3>
                  </div>
                </AccordionTrigger>

                <AccordionContent>
                  <p className="text-gray-600">{event.description}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Resources Preview */}
      <ResourcesSummary />
      <Footer />
    </main>
  );
}
