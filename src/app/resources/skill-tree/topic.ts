export type Topic = {
    id: string;
    label: string;
    desc?: string;
    relevantLinks: string[];
    completed?: boolean;
    unlocked?: boolean;
    coveredOn?: Date;
};

export type Prereq = { source: Topic["id"]; target: Topic["id"] };
