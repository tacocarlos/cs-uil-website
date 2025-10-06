// apcsaGraph.ts
export type Topic = {
    id: string;
    label: string;
    unit: number;
    desc?: string;
};

export type Prereq = { source: string; target: string };

export const TOPICS: Topic[] = [
    {
        id: "U1",
        unit: 1,
        label: "Unit 1: Primitive Types",
        desc: "Variables, primitive types, expressions, casting, basics.",
    },
    {
        id: "U2",
        unit: 2,
        label: "Unit 2: Using Objects",
        desc: "References, methods, String, Math, wrapper classes, APIs.",
    },
    {
        id: "U3",
        unit: 3,
        label: "Unit 3: Boolean Expressions and if Statements",
        desc: "Relational/logical operators, De Morgan’s Law, conditionals.",
    },
    {
        id: "U4",
        unit: 4,
        label: "Unit 4: Iteration",
        desc: "While loops, for loops, nested iteration, off-by-one errors.",
    },
    {
        id: "U5",
        unit: 5,
        label: "Unit 5: Writing Classes",
        desc: "Classes, constructors, fields, methods, encapsulation.",
    },
    {
        id: "U6",
        unit: 6,
        label: "Unit 6: Arrays",
        desc: "1D arrays, traversal, enhanced for loop.",
    },
    {
        id: "U7",
        unit: 7,
        label: "Unit 7: ArrayList",
        desc: "ArrayList methods, traversal, pitfalls.",
    },
    {
        id: "U8",
        unit: 8,
        label: "Unit 8: 2D Arrays",
        desc: "Indexing, traversal, row/column major.",
    },
    {
        id: "U9",
        unit: 9,
        label: "Unit 9: Inheritance",
        desc: "Extends, overriding, polymorphism.",
    },
    {
        id: "U10",
        unit: 10,
        label: "Unit 10: Recursion",
        desc: "Base/recursive cases, tracing, patterns.",
    },
];

export const PREREQS: Prereq[] = [
    { source: "U1", target: "U2" },
    { source: "U2", target: "U3" },
    { source: "U3", target: "U4" },
    { source: "U4", target: "U5" },
    { source: "U5", target: "U6" },
    { source: "U6", target: "U7" },
    { source: "U7", target: "U8" },
    { source: "U5", target: "U9" },
    { source: "U4", target: "U10" },
];
