// apcsaGraph.ts
import type { Topic, Prereq } from "../topic";

export const TOPICS: Topic[] = [
    {
        id: "u1.1",
        label: "Introduction to Algorithms, Programming, and Compilers",
        completed: true,
        relevantLinks: [],
    },
    {
        id: "u1.2",
        label: "Variables and Data Types",
        completed: true,
        relevantLinks: [],
    },
    {
        id: "u1.3",
        label: "Expressions and Output",
        completed: true,
        relevantLinks: [],
    },
    {
        id: "u1.4",
        label: "Assignment Statements and Input",
        completed: true,
        relevantLinks: [],
    },
    {
        id: "u1.5",
        label: "Casting of Ranges and Variables",
        completed: true,
        relevantLinks: [],
    },
    {
        id: "u1.6",
        label: "Compound Assignment Operators",
        completed: true,
        relevantLinks: [],
    },
    {
        id: "u1.7",
        label: "API and Libraries",
        unlocked: true,
        relevantLinks: [],
    },
    {
        id: "u1.8",
        label: "Documentation with Comments",
        unlocked: true,
        relevantLinks: [],
    },
    {
        id: "u1.9",
        label: "Method Signatures",
        relevantLinks: [],
    },
    {
        id: "u1.10",
        label: "Calling Class Methods",
        relevantLinks: [],
    },
    {
        id: "u1.11",
        label: "Using the Math Class",
        relevantLinks: [],
    },
    {
        id: "u1.12",
        label: "Objects: Instances of Classes",
        relevantLinks: [],
    },
    {
        id: "u1.13",
        label: "Object Creation and Storage (Instantiation)",
        relevantLinks: [],
    },
    {
        id: "u1.14",
        label: "Calling Instance Methods",
        relevantLinks: [],
    },
    {
        id: "u1.15",
        label: "String Manipulation",
        relevantLinks: [],
    },
];

export const PREREQS: Prereq[] = [
    { source: "u1.1", target: "u1.2" },
    { source: "u1.2", target: "u1.3" },
    { source: "u1.3", target: "u1.4" },
    { source: "u1.4", target: "u1.5" },
    { source: "u1.4", target: "u1.6" },
    { source: "u1.6", target: "u1.7" },
    { source: "u1.7", target: "u1.8" },
    { source: "u1.8", target: "u1.9" },
    { source: "u1.9", target: "u1.10" },
    { source: "u1.10", target: "u1.11" },
    { source: "u1.10", target: "u1.12" },
    { source: "u1.12", target: "u1.13" },
    { source: "u1.13", target: "u1.14" },
    { source: "u1.14", target: "u1.15" },
];
