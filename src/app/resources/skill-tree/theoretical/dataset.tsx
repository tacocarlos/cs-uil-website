// apcsaGraph.ts
import type { Topic, Prereq } from "../topic";

export const TOPICS: Topic[] = [
    {
        id: "pseudocode",
        label: "Pseudocode",
        desc: "Writing code without writing code",
        relevantLinks: [],
        completed: true,
    },
    {
        id: "alg-analy",
        label: "Algorithm Analysis: Basic O(n)",
        desc: "Basic Algorithm Analysis: Polynomial Time Complexities",
        relevantLinks: [],
        completed: true,
    },
    {
        id: "adt1",
        label: "Abstract Data Types Part 1",
        desc: "List, Stack, Queue, Set, Map, and Hashing",
        relevantLinks: [],
        completed: true,
    },
    {
        id: "discrete-1",
        label: "Fundamentals of Discrete Math",
        desc: "Sets (the mathematical one, not the ADT), Combinatorics, and the Pigeonhole Principle",
        relevantLinks: [],
        unlocked: true,
    },
    {
        id: "graphs-1",
        label: "Graph Basics",
        desc: "The basics of graphs: code representations and methods.",
        relevantLinks: [],
        unlocked: false,
    },
];

export const PREREQS: Prereq[] = [
    { source: "pseudocode", target: "alg-analy" },
    { source: "alg-analy", target: "adt1" },
    { source: "adt1", target: "graphs-1" },
    { source: "discrete-1", target: "graphs-1" },
];
