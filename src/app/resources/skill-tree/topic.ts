export type Topic = {
    id: string;
    label: string;
    desc?: string;
    relevantLinks: string[];
    completed?: boolean;
    unlocked?: boolean;
};

export type Prereq = { source: string; target: string };
