// apcsaGraph.ts
import type { Topic, Prereq } from "../topic";

const UNIT_ONE_TOPICS: Topic[] = [
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
        completed: true,
        relevantLinks: [],
    },
    {
        id: "u1.8",
        label: "Documentation with Comments",
        completed: true,
        relevantLinks: [],
    },
    {
        id: "u1.9",
        label: "Method Signatures",
        completed: true,
        relevantLinks: [],
    },
    {
        id: "u1.10",
        label: "Calling Class Methods",
        completed: true,
        relevantLinks: [],
    },
    {
        id: "u1.11",
        label: "Using the Math Class",
        relevantLinks: [],
        completed: true,
    },
    {
        id: "u1.12",
        label: "Objects: Instances of Classes",
        completed: true,
        relevantLinks: [],
    },
    {
        id: "u1.13",
        label: "Object Creation and Storage (Instantiation)",
        relevantLinks: [],
        completed: true,
    },
    {
        id: "u1.14",
        label: "Calling Instance Methods",
        completed: true,
        relevantLinks: [],
    },
    {
        id: "u1.15",
        label: "String Manipulation",
        completed: true,
        relevantLinks: [],
    },
];

const UNIT_TWO_TOPICS: Topic[] = [
    {
        id: "u2.1",
        label: "Algorithms with Selection and Repetition",
        unlocked: true,
        relevantLinks: [],
    },
    {
        id: "u2.2",
        label: "Boolean Expressions",
        unlocked: true,
        relevantLinks: [],
    },
    {
        id: "u2.3",
        label: "If Else Statements",
        relevantLinks: [],
    },
    {
        id: "u2.4",
        label: "Nested If Statements",
        relevantLinks: [],
    },
    {
        id: "u2.5",
        label: "Compound Boolean Expressions",
        relevantLinks: [],
    },
];

export const TOPICS: Topic[] = [...UNIT_ONE_TOPICS, ...UNIT_TWO_TOPICS];

const UNIT_ONE: Prereq[] = [
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

const UNIT_TWO_PREREQ: Prereq[] = [
    { source: "u2.1", target: "u2.2" },
    { source: "u2.2", target: "u2.3" },
    { source: "u2.3", target: "u2.4" },
    { source: "u2.4", target: "u2.5" },
];

const TRANSITION_PREREQ: Prereq[] = [{ source: "u1.15", target: "u2.1" }];

export const PREREQS: Prereq[] = [
    ...UNIT_ONE,
    ...UNIT_TWO_PREREQ,
    ...TRANSITION_PREREQ,
];
