import Footer from "~/components/global/Footer";
import Hero from "~/components/global/Hero";
import ResourcesSummary from "~/components/resources/ResourcesSummary";
import Timeline, { DefaultTimelineData } from "~/components/timeline/Timeline";

export default function Home() {
    return (
        <main className="from-primary to-secondary min-h-screen bg-gradient-to-b">
            <Hero />

            {/* Competition Timeline */}
            <Timeline
                events={DefaultTimelineData}
                timelineTitle="GHS CS UIL Team Events"
            />

            {/* Resources Preview */}
            <ResourcesSummary />
            <Footer />
        </main>
    );
}
