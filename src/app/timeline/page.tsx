import Timeline, { DefaultTimelineData } from "~/components/timeline/Timeline";

export default function TimelinePage() {
    return (
        <main className="bg-primary">
            <Timeline
                events={DefaultTimelineData}
                timelineTitle="Computer Science UIL 2026-2027 Activities"
                scrollToDesignated
            />
        </main>
    );
}
