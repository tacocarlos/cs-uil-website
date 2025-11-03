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
        completed: true,
    },
    {
        id: "adt2",
        label: "Abstract Data Types Part 2",
        desc: "ArrayList and LinkedLists, Trees, Binary Search Trees, Heaps",
        relevantLinks: ["https://www.youtube.com/watch?v=B7hVxCmfPtM"],
        completed: true,
        coveredOn: new Date("Friday October 17, 2025"),
    },
    {
        id: "graphs-1",
        label: "Graph Basics",
        desc: "The basics of graphs: code representations and methods.",
        relevantLinks: [],
        unlocked: true,
    },
];

export const PREREQS: Prereq[] = [
    { source: "pseudocode", target: "alg-analy" },
    { source: "alg-analy", target: "adt1" },
    { source: "adt1", target: "graphs-1" },
    { source: "adt1", target: "adt2" },
    { source: "adt2", target: "graphs-1" },
    { source: "discrete-1", target: "graphs-1" },
];
