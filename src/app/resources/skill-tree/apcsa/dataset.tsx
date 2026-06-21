// AP Computer Science A – Codio course skill-tree dataset
import type { Topic, Prereq } from "../topic";

// ─── Unit 1 – Primitive Types (all completed) ────────────────────────────────

const UNIT_1_TOPICS: Topic[] = [
    {
        id: "u1.1",
        label: "Why Java & Compilers",
        desc: "Understand why Java is used in AP CSA and how source code is compiled to bytecode.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "u1.2",
        label: "Primitive Data Types",
        desc: "Learn the four core primitives: int, double, boolean, and char.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "u1.3",
        label: "Variables & Assignment",
        desc: "Declare and initialize variables, and understand how assignment stores values in memory.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "u1.4",
        label: "Arithmetic Expressions",
        desc: "Evaluate arithmetic expressions using +, -, *, /, and % with correct operator precedence.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "u1.5",
        label: "String Concatenation",
        desc: "Combine strings and primitives using the + operator to produce new String values.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "u1.6",
        label: "Casting & Ranges",
        desc: "Cast between numeric types and understand the value ranges of int and double.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "u1.7",
        label: "Compound Assignment Operators",
        desc: "Use +=, -=, *=, /=, and %= to update variable values concisely.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "u1.8",
        label: "Math Class Methods",
        desc: "Call static methods such as Math.abs, Math.pow, Math.sqrt, and Math.random.",
        relevantLinks: [],
        completed: false,
    },
];

// ─── Unit 2 – Using Objects (all completed) ──────────────────────────────────

const UNIT_2_TOPICS: Topic[] = [
    {
        id: "u2.1",
        label: "Objects & Classes",
        desc: "Distinguish between a class (blueprint) and an object (instance) in Java.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "u2.2",
        label: "Constructors & Instantiation",
        desc: "Create new objects using the new keyword and understand how constructors initialize state.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "u2.3",
        label: "void Methods",
        desc: "Call methods that perform actions but do not return a value.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "u2.4",
        label: "Non-void Methods & Return Values",
        desc: "Call methods that compute and return a value, and use that value in expressions.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "u2.5",
        label: "String Methods",
        desc: "Use length(), substring(), indexOf(), and equals() to inspect and manipulate strings.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "u2.6",
        label: "Integer & Double Wrapper Classes",
        desc: "Use Integer and Double wrapper classes and their useful constants and methods.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "u2.7",
        label: "null References",
        desc: "Understand what null means, when it occurs, and how to guard against NullPointerException.",
        relevantLinks: [],
        completed: false,
    },
];

// ─── Unit 3 – Boolean Expressions & if Statements (all completed) ────────────

const UNIT_3_TOPICS: Topic[] = [
    {
        id: "u3.1",
        label: "Boolean Expressions",
        desc: "Write boolean expressions using relational operators ==, !=, <, >, <=, and >=.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "u3.2",
        label: "if / else if / else",
        desc: "Control program flow using if, else if, and else to handle mutually exclusive conditions.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "u3.3",
        label: "Nested Conditionals",
        desc: "Write conditionals inside other conditionals to handle multi-level decision logic.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "u3.4",
        label: "Compound Boolean Expressions",
        desc: "Combine conditions with the logical operators &&, ||, and ! to form complex predicates.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "u3.5",
        label: "De Morgan's Law",
        desc: "Apply De Morgan's Law to simplify and negate compound boolean expressions.",
        relevantLinks: [],
        completed: false,
    },
    {
        id: "u3.6",
        label: "Comparing Objects with .equals()",
        desc: "Use .equals() instead of == to compare object contents for equality.",
        relevantLinks: [],
        completed: false,
    },
];

// ─── Unit 4 – Iteration (u4.1 & u4.2 unlocked, rest locked) ─────────────────

const UNIT_4_TOPICS: Topic[] = [
    {
        id: "u4.1",
        label: "while Loops",
        desc: "Repeat a block of code using a while loop as long as a condition remains true.",
        relevantLinks: [],
    },
    {
        id: "u4.2",
        label: "for Loops",
        desc: "Use a for loop with an initializer, condition, and update expression to iterate a known number of times.",
        relevantLinks: [],
    },
    {
        id: "u4.3",
        label: "String Traversal with Loops",
        desc: "Iterate over every character in a String using index-based loops and charAt().",
        relevantLinks: [],
    },
    {
        id: "u4.4",
        label: "Nested Iteration",
        desc: "Place one loop inside another to process multi-dimensional or pairwise data.",
        relevantLinks: [],
    },
    {
        id: "u4.5",
        label: "Off-by-One Errors & Loop Analysis",
        desc: "Identify and fix common off-by-one boundary mistakes and trace loop execution.",
        relevantLinks: [],
    },
];

// ─── Unit 5 – Writing Classes (all locked) ───────────────────────────────────

const UNIT_5_TOPICS: Topic[] = [
    {
        id: "u5.1",
        label: "Class Anatomy & Design",
        desc: "Identify the parts of a Java class definition and plan a class from a real-world description.",
        relevantLinks: [],
    },
    {
        id: "u5.2",
        label: "Instance Variables & Encapsulation",
        desc: "Declare private instance variables and explain why encapsulation protects object state.",
        relevantLinks: [],
    },
    {
        id: "u5.3",
        label: "Constructors",
        desc: "Write constructors that accept parameters to initialize an object's instance variables.",
        relevantLinks: [],
    },
    {
        id: "u5.4",
        label: "Accessor (Getter) Methods",
        desc: "Write public getter methods that return the value of a private instance variable.",
        relevantLinks: [],
    },
    {
        id: "u5.5",
        label: "Mutator (Setter) Methods",
        desc: "Write public setter methods that validate and update a private instance variable.",
        relevantLinks: [],
    },
    {
        id: "u5.6",
        label: "static Variables & Methods",
        desc: "Declare class-level static fields and methods that are shared across all instances.",
        relevantLinks: [],
    },
    {
        id: "u5.7",
        label: "this Keyword",
        desc: "Use this to refer to the current object's fields and to chain constructors.",
        relevantLinks: [],
    },
    {
        id: "u5.8",
        label: "Scope & Access Modifiers",
        desc: "Explain how variable scope and public/private access modifiers control visibility.",
        relevantLinks: [],
    },
];

// ─── Unit 6 – Arrays (all locked) ────────────────────────────────────────────

const UNIT_6_TOPICS: Topic[] = [
    {
        id: "u6.1",
        label: "Array Creation & Access",
        desc: "Declare, initialize, and access elements of a one-dimensional array using index notation.",
        relevantLinks: [],
    },
    {
        id: "u6.2",
        label: "Array Traversal",
        desc: "Iterate over all elements of an array using both standard for and enhanced for loops.",
        relevantLinks: [],
    },
    {
        id: "u6.3",
        label: "Enhanced for Loop",
        desc: "Use the for-each syntax to traverse arrays and collections without managing an index.",
        relevantLinks: [],
    },
    {
        id: "u6.4",
        label: "Common Array Algorithms",
        desc: "Implement algorithms to find the minimum, maximum, sum, and reverse of an array.",
        relevantLinks: [],
    },
];

// ─── Unit 7 – ArrayList (all locked) ─────────────────────────────────────────

const UNIT_7_TOPICS: Topic[] = [
    {
        id: "u7.1",
        label: "ArrayList Creation & Methods",
        desc: "Create an ArrayList and use add(), remove(), get(), set(), and size() to manage it.",
        relevantLinks: [],
    },
    {
        id: "u7.2",
        label: "Traversing an ArrayList",
        desc: "Iterate over an ArrayList safely using both index-based and enhanced for loops.",
        relevantLinks: [],
    },
    {
        id: "u7.3",
        label: "Linear Search",
        desc: "Implement linear search to find an element by scanning an ArrayList sequentially.",
        relevantLinks: [],
    },
    {
        id: "u7.4",
        label: "Selection Sort",
        desc: "Sort an ArrayList in place by repeatedly selecting the minimum remaining element.",
        relevantLinks: [],
    },
    {
        id: "u7.5",
        label: "Insertion Sort",
        desc: "Sort an ArrayList by inserting each element into its correct position in the sorted portion.",
        relevantLinks: [],
    },
];

// ─── Unit 8 – 2D Arrays (all locked) ─────────────────────────────────────────

const UNIT_8_TOPICS: Topic[] = [
    {
        id: "u8.1",
        label: "Creating & Accessing 2D Arrays",
        desc: "Declare, initialize, and access elements of a two-dimensional array using row and column indices.",
        relevantLinks: [],
    },
    {
        id: "u8.2",
        label: "Row-Major Traversal",
        desc: "Traverse a 2D array row by row using nested loops.",
        relevantLinks: [],
    },
    {
        id: "u8.3",
        label: "Column-Major Traversal",
        desc: "Traverse a 2D array column by column using nested loops.",
        relevantLinks: [],
    },
];

// ─── Unit 9 – Inheritance (all locked) ───────────────────────────────────────

const UNIT_9_TOPICS: Topic[] = [
    {
        id: "u9.1",
        label: "Superclasses & Subclasses",
        desc: "Model is-a relationships by designing a class hierarchy with a superclass and subclasses.",
        relevantLinks: [],
    },
    {
        id: "u9.2",
        label: "extends Keyword",
        desc: "Use extends to create a subclass that inherits fields and methods from a superclass.",
        relevantLinks: [],
    },
    {
        id: "u9.3",
        label: "Constructor Chaining with super",
        desc: "Call a superclass constructor from a subclass constructor using the super() syntax.",
        relevantLinks: [],
    },
    {
        id: "u9.4",
        label: "Method Overriding",
        desc: "Override an inherited method in a subclass to provide specialized behavior.",
        relevantLinks: [],
    },
    {
        id: "u9.5",
        label: "Polymorphism",
        desc: "Use a superclass reference to hold a subclass object and understand dynamic dispatch.",
        relevantLinks: [],
    },
    {
        id: "u9.6",
        label: "instanceof Operator",
        desc: "Use instanceof to test an object's runtime type before casting.",
        relevantLinks: [],
    },
    {
        id: "u9.7",
        label: "Object Superclass & toString()",
        desc: "Understand that every Java class inherits from Object and override toString() for readable output.",
        relevantLinks: [],
    },
];

// ─── Unit 10 – Recursion (all locked) ────────────────────────────────────────

const UNIT_10_TOPICS: Topic[] = [
    {
        id: "u10.1",
        label: "Base Case & Recursive Case",
        desc: "Identify the base case that stops recursion and the recursive case that reduces the problem.",
        relevantLinks: [],
    },
    {
        id: "u10.2",
        label: "Tracing Recursive Calls",
        desc: "Manually trace the call stack of a recursive method to predict its output.",
        relevantLinks: [],
    },
    {
        id: "u10.3",
        label: "Recursive Search & Sort (Merge Sort intro)",
        desc: "Apply recursion to binary search and understand the divide-and-conquer strategy of merge sort.",
        relevantLinks: [],
    },
];

// ─── Exported TOPICS ─────────────────────────────────────────────────────────

export const TOPICS: Topic[] = [
    ...UNIT_1_TOPICS,
    ...UNIT_2_TOPICS,
    ...UNIT_3_TOPICS,
    ...UNIT_4_TOPICS,
    ...UNIT_5_TOPICS,
    ...UNIT_6_TOPICS,
    ...UNIT_7_TOPICS,
    ...UNIT_8_TOPICS,
    ...UNIT_9_TOPICS,
    ...UNIT_10_TOPICS,
];

// ─── Prereqs ──────────────────────────────────────────────────────────────────

const UNIT_1_PREREQS: Prereq[] = [
    { source: "u1.1", target: "u1.2" },
    { source: "u1.2", target: "u1.3" },
    { source: "u1.3", target: "u1.4" },
    { source: "u1.4", target: "u1.5" },
    { source: "u1.4", target: "u1.6" },
    { source: "u1.5", target: "u1.7" },
    { source: "u1.6", target: "u1.7" },
    { source: "u1.7", target: "u1.8" },
];

const UNIT_2_PREREQS: Prereq[] = [
    { source: "u2.1", target: "u2.2" },
    { source: "u2.2", target: "u2.3" },
    { source: "u2.3", target: "u2.4" },
    { source: "u2.4", target: "u2.5" },
    { source: "u2.5", target: "u2.6" },
    { source: "u2.6", target: "u2.7" },
];

const UNIT_3_PREREQS: Prereq[] = [
    { source: "u3.1", target: "u3.2" },
    { source: "u3.2", target: "u3.3" },
    { source: "u3.3", target: "u3.4" },
    { source: "u3.4", target: "u3.5" },
    // .equals() requires knowing objects (Unit 2) and boolean expressions
    { source: "u3.5", target: "u3.6" },
    { source: "u2.5", target: "u3.6" }, // String.equals() builds on String methods
];

const UNIT_4_PREREQS: Prereq[] = [
    { source: "u4.1", target: "u4.2" },
    { source: "u4.2", target: "u4.3" },
    { source: "u4.3", target: "u4.4" },
    { source: "u4.4", target: "u4.5" },
];

const UNIT_5_PREREQS: Prereq[] = [
    { source: "u5.1", target: "u5.2" },
    { source: "u5.2", target: "u5.3" },
    { source: "u5.3", target: "u5.4" },
    { source: "u5.4", target: "u5.5" },
    { source: "u5.5", target: "u5.6" },
    { source: "u5.6", target: "u5.7" },
    { source: "u5.7", target: "u5.8" },
];

const UNIT_6_PREREQS: Prereq[] = [
    { source: "u6.1", target: "u6.2" },
    { source: "u6.2", target: "u6.3" },
    { source: "u6.3", target: "u6.4" },
];

const UNIT_7_PREREQS: Prereq[] = [
    { source: "u7.1", target: "u7.2" },
    { source: "u7.2", target: "u7.3" },
    { source: "u7.3", target: "u7.4" },
    { source: "u7.4", target: "u7.5" },
];

const UNIT_8_PREREQS: Prereq[] = [
    { source: "u8.1", target: "u8.2" },
    { source: "u8.2", target: "u8.3" },
];

const UNIT_9_PREREQS: Prereq[] = [
    { source: "u9.1", target: "u9.2" },
    { source: "u9.2", target: "u9.3" },
    { source: "u9.3", target: "u9.4" },
    { source: "u9.4", target: "u9.5" },
    { source: "u9.5", target: "u9.6" },
    { source: "u9.6", target: "u9.7" },
];

const UNIT_10_PREREQS: Prereq[] = [
    { source: "u10.1", target: "u10.2" },
    { source: "u10.2", target: "u10.3" },
];

// Cross-unit transitions: last topic of unit N → first topic of unit N+1
const TRANSITION_PREREQS: Prereq[] = [
    { source: "u1.8", target: "u2.1" },
    { source: "u2.7", target: "u3.1" },
    { source: "u3.6", target: "u4.1" },
    { source: "u4.5", target: "u5.1" },
    { source: "u5.8", target: "u6.1" },
    // ArrayList builds on array concepts AND loop skills
    { source: "u6.4", target: "u7.1" },
    { source: "u4.5", target: "u7.1" },
    // 2D arrays build on 1D arrays and nested iteration
    { source: "u7.5", target: "u8.1" },
    { source: "u4.4", target: "u8.1" },
    // Inheritance builds on writing classes
    { source: "u8.3", target: "u9.1" },
    { source: "u5.8", target: "u9.1" },
    // Recursion builds on methods and iteration concepts
    { source: "u9.7", target: "u10.1" },
    { source: "u4.5", target: "u10.1" },
];

export const PREREQS: Prereq[] = [
    ...UNIT_1_PREREQS,
    ...UNIT_2_PREREQS,
    ...UNIT_3_PREREQS,
    ...UNIT_4_PREREQS,
    ...UNIT_5_PREREQS,
    ...UNIT_6_PREREQS,
    ...UNIT_7_PREREQS,
    ...UNIT_8_PREREQS,
    ...UNIT_9_PREREQS,
    ...UNIT_10_PREREQS,
    ...TRANSITION_PREREQS,
];
