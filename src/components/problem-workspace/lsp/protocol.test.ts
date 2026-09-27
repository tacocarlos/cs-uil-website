import { describe, expect, test } from "bun:test";
import {
    COMPLETION_KINDS,
    completionEdit,
    completionItems,
    definitionLocations,
    markerSeverityName,
    toLspPosition,
    toMarkdown,
    toMonacoRange,
} from "./protocol";

const range = {
    start: { line: 0, character: 4 },
    end: { line: 2, character: 0 },
};

describe("positions", () => {
    test("LSP ranges are 0-based, Monaco's 1-based", () => {
        expect(toMonacoRange(range)).toEqual({
            startLineNumber: 1,
            startColumn: 5,
            endLineNumber: 3,
            endColumn: 1,
        });
    });

    test("Monaco positions convert back", () => {
        expect(toLspPosition({ lineNumber: 1, column: 1 })).toEqual({
            line: 0,
            character: 0,
        });
    });
});

describe("toMarkdown", () => {
    test("handles every LSP content shape", () => {
        expect(toMarkdown("plain")).toBe("plain");
        expect(toMarkdown({ kind: "markdown", value: "**b**" })).toBe("**b**");
        expect(toMarkdown({ language: "java", value: "int x;" })).toBe(
            "```java\nint x;\n```",
        );
        expect(toMarkdown(["a", { language: "c", value: "x" }])).toBe(
            "a\n\n```c\nx\n```",
        );
    });

    test("treats empty content as nothing", () => {
        expect(toMarkdown(undefined)).toBeUndefined();
        expect(toMarkdown("")).toBeUndefined();
        expect(toMarkdown([])).toBeUndefined();
        expect(toMarkdown({ kind: "plaintext", value: "" })).toBeUndefined();
    });
});

describe("completions", () => {
    test("accepts both result shapes", () => {
        expect(completionItems(null)).toEqual({ items: [], incomplete: false });
        expect(completionItems([{ label: "a" }])).toEqual({
            items: [{ label: "a" }],
            incomplete: false,
        });
        expect(
            completionItems({ isIncomplete: true, items: [{ label: "b" }] }),
        ).toEqual({ items: [{ label: "b" }], incomplete: true });
    });

    test("prefers the text edit, then insertText, then the label", () => {
        expect(
            completionEdit({ label: "x", textEdit: { range, newText: "y" } }),
        ).toEqual({ range: toMonacoRange(range), text: "y" });
        expect(
            completionEdit({
                label: "x",
                textEdit: { insert: range, replace: range, newText: "z" },
            }),
        ).toEqual({ range: toMonacoRange(range), text: "z" });
        expect(completionEdit({ label: "x", insertText: "w" })).toEqual({
            text: "w",
        });
        expect(completionEdit({ label: "x" })).toEqual({ text: "x" });
    });

    test("maps every LSP completion kind", () => {
        for (let kind = 1; kind <= 25; kind++) {
            expect(COMPLETION_KINDS[kind]).toBeDefined();
        }
    });
});

test("diagnostic severities", () => {
    expect(markerSeverityName(1)).toBe("Error");
    expect(markerSeverityName(2)).toBe("Warning");
    expect(markerSeverityName(3)).toBe("Info");
    expect(markerSeverityName(4)).toBe("Hint");
    expect(markerSeverityName(undefined)).toBe("Error");
});

test("definition results normalize to locations", () => {
    const location = { uri: "file:///workspace/Main.java", range };
    expect(definitionLocations(null)).toEqual([]);
    expect(definitionLocations(location)).toEqual([location]);
    expect(
        definitionLocations([
            {
                targetUri: location.uri,
                targetRange: range,
                targetSelectionRange: range,
            },
        ]),
    ).toEqual([location]);
});
