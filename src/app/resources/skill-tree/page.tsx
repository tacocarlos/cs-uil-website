"use client";

import { useState } from "react";
import StaticSkillTree from "~/components/resources/skill-tree/skill-tree";
import { cn } from "~/lib/utils";
import {
    TOPICS as APCSA_TOPICS,
    PREREQS as APCSA_PREREQS,
} from "./apcsa/dataset";
import {
    TOPICS as THEORETICAL_TOPICS,
    PREREQS as THEORETICAL_PREREQS,
} from "./theoretical/dataset";

type Pane = "apcsa" | "theoretical";

const PANES = [
    {
        id: "apcsa" as const,
        label: "Programming Progress",
        component: (
            <StaticSkillTree
                direction="TB"
                topicData={APCSA_TOPICS}
                preReqData={APCSA_PREREQS}
            />
        ),
    },
    {
        id: "theoretical" as const,
        label: "Theoretical Progress",
        component: (
            <StaticSkillTree
                direction="TB"
                topicData={THEORETICAL_TOPICS}
                preReqData={THEORETICAL_PREREQS}
            />
        ),
    },
] as const;

export default function SkillTreePage() {
    const [activePane, setActivePane] = useState<Pane>("apcsa");

    return (
        <div className="flex h-dvh flex-col pt-16 md:pt-[10vh]">
            {/* Chrome-style tab bar */}
            <div className="bg-muted flex items-end border-b px-2 pt-2">
                {PANES.map((pane) => (
                    <button
                        key={pane.id}
                        onClick={() => setActivePane(pane.id)}
                        className={cn(
                            "relative -mb-px rounded-t-lg px-5 py-1.5 text-sm font-medium transition-colors select-none",
                            "max-w-xs min-w-36 truncate text-center",
                            activePane === pane.id
                                ? "border-b-background bg-background text-foreground z-10 border"
                                : "text-muted-foreground hover:bg-background/50 hover:text-foreground border border-transparent",
                        )}
                    >
                        {pane.label}
                    </button>
                ))}
            </div>

            {/* Active tree — only one mounted at a time so ReactFlow fitView works */}
            <div className="bg-background flex-1 p-4">
                {PANES.find((p) => p.id === activePane)?.component}
            </div>
        </div>
    );
}
