import Timeline, { DefaultTimelineData } from "~/components/timeline/Timeline";

export default function TimelinePage() {
    return (
        <main className="bg-primary">
            <Timeline
                events={DefaultTimelineData}
                timelineTitle="Computer Science UIL 2025-2026 Activities"
            />
        </main>
    );
}
