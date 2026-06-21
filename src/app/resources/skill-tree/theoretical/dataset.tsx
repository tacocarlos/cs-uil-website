import type { Topic, Prereq } from "../topic";

// ─── Section 1 – Number Systems (all completed) ───────────────────────────────
const numberSystems: Topic[] = [
    {
        id: "bin",
        label: "Binary (Base-2)",
        desc: "Count like a computer — master converting between binary and decimal.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "hex",
        label: "Hexadecimal & Octal",
        desc: "Base-16 and base-8 make large binary numbers way easier to read.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "twos",
        label: "Two's Complement",
        desc: "The clever trick computers use to store negative integers in binary.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "bitwise",
        label: "Bitwise Operations",
        desc: "AND, OR, XOR, NOT, and bit-shifting — super useful on UIL exams.",
        relevantLinks: [],
        completed: false,
    },
];

// ─── Section 2 – Boolean Logic (all completed) ────────────────────────────────
const booleanLogic: Topic[] = [
    {
        id: "gates",
        label: "Logic Gates",
        desc: "AND, OR, NOT, NAND, NOR, XOR — the building blocks of every chip.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "truth",
        label: "Truth Tables",
        desc: "Evaluate any boolean expression for every possible combination of inputs.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "demorgan",
        label: "De Morgan's Laws",
        desc: "Flip ands and ors when you push a NOT inside parentheses.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "circuits",
        label: "Logic Circuits",
        desc: "Chain gates together to build circuits and simplify complex expressions.",
        relevantLinks: [],
        completed: false,
    },
];

// ─── Section 3 – Java Fundamentals (all completed) ────────────────────────────
const javaFundamentals: Topic[] = [
    {
        id: "primitives",
        label: "Primitive Data Types",
        desc: "int, double, boolean, char — know their sizes and default values cold.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "vars",
        label: "Variables & Assignment",
        desc: "Declare, initialise, and update variables; understand the assignment operator.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "arith",
        label: "Arithmetic & String Operators",
        desc: "+, -, *, /, % — including integer division gotchas and String concatenation.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "io",
        label: "Console I/O",
        desc: "Read input with Scanner and print with System.out.print / println.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "casting",
        label: "Type Casting",
        desc: "Widening vs narrowing conversions and when you lose precision.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "strings",
        label: "String Basics",
        desc: "String literals, immutability, and the methods that show up every contest.",
        relevantLinks: [],
        completed: false,
    },
];

// ─── Section 4 – Control Flow (first 2 unlocked, rest locked) ─────────────────
const controlFlow: Topic[] = [
    {
        id: "ifelse",
        label: "if / else if / else",
        desc: "Branch your code based on boolean conditions — the heart of decision-making.",
        relevantLinks: [],
    },
    {
        id: "switch",
        label: "switch Statements",
        desc: "Clean multi-way branching when you're comparing one value to many cases.",
        relevantLinks: [],
    },
    {
        id: "while",
        label: "while Loops",
        desc: "Keep repeating code for as long as a condition stays true.",
        relevantLinks: [],
    },
    {
        id: "forloop",
        label: "for Loops",
        desc: "Counted iteration with init, condition, and update — the workhorse loop.",
        relevantLinks: [],
    },
    {
        id: "nested",
        label: "Nested Loops",
        desc: "Loops inside loops unlock grid traversal and pair-counting problems.",
        relevantLinks: [],
    },
];

// ─── Section 5 – Methods (all locked) ─────────────────────────────────────────
const methods: Topic[] = [
    {
        id: "methods",
        label: "Defining Methods",
        desc: "Return types, parameters, and how the call stack keeps track of everything.",
        relevantLinks: [],
    },
    {
        id: "overload",
        label: "Method Overloading",
        desc: "Same name, different signature — Java picks the right version automatically.",
        relevantLinks: [],
    },
    {
        id: "scope",
        label: "Scope & Local Variables",
        desc: "Understand where a variable lives and exactly when Java destroys it.",
        relevantLinks: [],
    },
    {
        id: "recursion-intro",
        label: "Introduction to Recursion",
        desc: "Base case + recursive case — teach a method to call itself safely.",
        relevantLinks: [],
    },
];

// ─── Section 6 – Arrays (all locked) ──────────────────────────────────────────
const arrays: Topic[] = [
    {
        id: "arrays1d",
        label: "1D Arrays",
        desc: "Create, index, and loop through a fixed-length list of values.",
        relevantLinks: [],
    },
    {
        id: "arrays2d",
        label: "2D Arrays",
        desc: "Rows and columns — use nested loops to touch every cell.",
        relevantLinks: [],
    },
    {
        id: "arraylist",
        label: "ArrayList",
        desc: "Dynamic lists that grow on demand; add, remove, get, size are your friends.",
        relevantLinks: [],
    },
    {
        id: "array-algos",
        label: "Common Array Algorithms",
        desc: "Find min/max, reverse an array, and count occurrences — contest staples.",
        relevantLinks: [],
    },
];

// ─── Section 7 – Searching (all locked) ───────────────────────────────────────
const searching: Topic[] = [
    {
        id: "linear-search",
        label: "Linear Search",
        desc: "Scan every element — O(n) but works on any unsorted array.",
        relevantLinks: [],
    },
    {
        id: "binary-search",
        label: "Binary Search",
        desc: "Cut the search space in half each step — O(log n) on sorted arrays.",
        relevantLinks: [],
    },
    {
        id: "search-analysis",
        label: "Search Algorithm Analysis",
        desc: "Compare linear vs binary search and build your Big-O intuition.",
        relevantLinks: [],
    },
];

// ─── Section 8 – Sorting (all locked) ─────────────────────────────────────────
const sorting: Topic[] = [
    {
        id: "bubble",
        label: "Bubble Sort",
        desc: "Swap adjacent elements repeatedly — simple to code, O(n²) worst case.",
        relevantLinks: [],
    },
    {
        id: "selection",
        label: "Selection Sort",
        desc: "Find the minimum each pass and place it — easy to trace by hand.",
        relevantLinks: [],
    },
    {
        id: "insertion",
        label: "Insertion Sort",
        desc: "Build a sorted section one element at a time — fast on nearly-sorted data.",
        relevantLinks: [],
    },
    {
        id: "merge",
        label: "Merge Sort",
        desc: "Divide, sort halves, merge — O(n log n) and stable every time.",
        relevantLinks: [],
    },
    {
        id: "sort-compare",
        label: "Sorting Comparison",
        desc: "When to pick which sort; stability and in-place explained simply.",
        relevantLinks: [],
    },
];

// ─── Section 9 – Recursion (all locked) ───────────────────────────────────────
const recursion: Topic[] = [
    {
        id: "recursion-patterns",
        label: "Common Recursive Patterns",
        desc: "Factorial, Fibonacci, array sum — the classic trio that trains your brain.",
        relevantLinks: [],
    },
    {
        id: "recursion-strings",
        label: "Recursion on Strings & Arrays",
        desc: "Reverse a string, check for palindromes, and search recursively.",
        relevantLinks: [],
    },
    {
        id: "recursion-analysis",
        label: "Analysing Recursive Algorithms",
        desc: "Intuitively understand recurrence relations without heavy math.",
        relevantLinks: [],
    },
];

// ─── Section 10 – Data Structures (all locked) ────────────────────────────────
const dataStructures: Topic[] = [
    {
        id: "stack",
        label: "Stack (LIFO)",
        desc: "Push, pop, peek — model undo history or the call stack itself.",
        relevantLinks: [],
    },
    {
        id: "queue",
        label: "Queue (FIFO)",
        desc: "Enqueue and dequeue — model task scheduling and power BFS.",
        relevantLinks: [],
    },
    {
        id: "linkedlist",
        label: "Linked List",
        desc: "Nodes that point to each other — great insertion/deletion, poor random access.",
        relevantLinks: [],
    },
    {
        id: "bst",
        label: "Binary Search Tree",
        desc: "Insert, search, and traverse in-order to get a sorted sequence.",
        relevantLinks: [],
    },
    {
        id: "hashmap",
        label: "Hash Map",
        desc: "Key-value storage with O(1) average lookup — the most useful data structure.",
        relevantLinks: [],
    },
];

// ─── Section 11 – Algorithm Analysis (all locked) ─────────────────────────────
const algorithmAnalysis: Topic[] = [
    {
        id: "bigo",
        label: "Big-O Notation",
        desc: "Express how runtime grows — O(1), O(log n), O(n), O(n²) and beyond.",
        relevantLinks: [],
    },
    {
        id: "complexity-classes",
        label: "Common Complexity Classes",
        desc: "Spot O(n log n) and O(2ⁿ) patterns directly in code.",
        relevantLinks: [],
    },
    {
        id: "space",
        label: "Space Complexity",
        desc: "Stack frames, auxiliary arrays, and the cost of in-place vs extra memory.",
        relevantLinks: [],
    },
    {
        id: "tradeoffs",
        label: "Time vs Space Tradeoffs",
        desc: "Sometimes spending more memory buys you a huge speed-up — know when.",
        relevantLinks: [],
    },
];

// ─── Section 12 – Graphs (all locked) ─────────────────────────────────────────
const graphs: Topic[] = [
    {
        id: "graph-repr",
        label: "Graph Representations",
        desc: "Adjacency matrix vs adjacency list — pick the right one for the problem.",
        relevantLinks: [],
    },
    {
        id: "dfs",
        label: "Depth-First Search (DFS)",
        desc: "Go deep before wide — find paths, detect cycles, explore mazes.",
        relevantLinks: [],
    },
    {
        id: "bfs",
        label: "Breadth-First Search (BFS)",
        desc: "Explore level by level — finds the shortest path in unweighted graphs.",
        relevantLinks: [],
    },
    {
        id: "graph-apps",
        label: "Graph Applications",
        desc: "Social networks, maps, dependency resolution — graphs are everywhere.",
        relevantLinks: [],
    },
];

// ─── Exported arrays ──────────────────────────────────────────────────────────

export const TOPICS: Topic[] = [
    ...numberSystems,
    ...booleanLogic,
    ...javaFundamentals,
    ...controlFlow,
    ...methods,
    ...arrays,
    ...searching,
    ...sorting,
    ...recursion,
    ...dataStructures,
    ...algorithmAnalysis,
    ...graphs,
];

export const PREREQS: Prereq[] = [
    // Section 1 – Number Systems chain
    { source: "bin", target: "hex" },
    { source: "hex", target: "twos" },
    { source: "twos", target: "bitwise" },

    // Section 2 – Boolean Logic chain
    { source: "gates", target: "truth" },
    { source: "truth", target: "demorgan" },
    { source: "demorgan", target: "circuits" },

    // Section 3 – Java Fundamentals chain
    { source: "primitives", target: "vars" },
    { source: "vars", target: "arith" },
    { source: "arith", target: "io" },
    { source: "io", target: "casting" },
    { source: "casting", target: "strings" },

    // Sections 3 → 4 bridges
    { source: "strings", target: "ifelse" },
    { source: "bitwise", target: "ifelse" },

    // Section 4 – Control Flow chain
    { source: "ifelse", target: "switch" },
    { source: "switch", target: "while" },
    { source: "while", target: "forloop" },
    { source: "forloop", target: "nested" },

    // Section 4 → 5 (Methods)
    { source: "forloop", target: "methods" },
    { source: "methods", target: "overload" },
    { source: "overload", target: "scope" },
    { source: "scope", target: "recursion-intro" },

    // Section 4 → 6 (Arrays)
    { source: "forloop", target: "arrays1d" },
    { source: "arrays1d", target: "arrays2d" },
    { source: "arrays2d", target: "arraylist" },
    { source: "arraylist", target: "array-algos" },

    // Section 6 → 7 (Searching)
    { source: "array-algos", target: "linear-search" },
    { source: "linear-search", target: "binary-search" },
    { source: "binary-search", target: "search-analysis" },

    // Section 6 → 8 (Sorting)
    { source: "array-algos", target: "bubble" },
    { source: "bubble", target: "selection" },
    { source: "selection", target: "insertion" },
    { source: "insertion", target: "merge" },
    { source: "merge", target: "sort-compare" },

    // Section 5 → 9 (Recursion deep-dive)
    { source: "recursion-intro", target: "recursion-patterns" },
    { source: "recursion-patterns", target: "recursion-strings" },
    { source: "recursion-strings", target: "recursion-analysis" },

    // Section 8 + 7 → 11 (Algorithm Analysis)
    { source: "sort-compare", target: "bigo" },
    { source: "search-analysis", target: "bigo" },
    { source: "bigo", target: "complexity-classes" },
    { source: "complexity-classes", target: "space" },
    { source: "space", target: "tradeoffs" },

    // Section 6 → 10 (Data Structures)
    { source: "arraylist", target: "stack" },
    { source: "stack", target: "queue" },
    { source: "queue", target: "linkedlist" },
    { source: "linkedlist", target: "bst" },
    { source: "bst", target: "hashmap" },

    // Section 10 + 11 → 12 (Graphs)
    { source: "bst", target: "graph-repr" },
    { source: "graph-repr", target: "dfs" },
    { source: "dfs", target: "bfs" },
    { source: "bfs", target: "graph-apps" },
];
