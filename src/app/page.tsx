import Footer from "~/components/global/Footer";
import Hero from "~/components/global/Hero";
import ResourcesSummary from "~/components/resources/ResourcesSummary";
import Timeline, { DefaultTimelineData } from "~/components/timeline/Timeline";

export default function Home() {
    return (
        <div className="min-h-screen">
            <Hero />

            {/* Competition Timeline */}
            <Timeline
                events={DefaultTimelineData}
                timelineTitle="CS UIL Team Events"
            />

            {/* Resources Preview */}
            {/*<ResourcesSummary />*/}
            <Footer />
        </div>
    );
}
