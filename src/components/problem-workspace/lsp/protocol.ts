/**
 * The subset of LSP types the editor uses, and conversions to Monaco's
 * equivalents. Kept free of runtime Monaco imports so it can be unit-tested.
 *
 * Positions: LSP is 0-based, Monaco 1-based. Both count columns in UTF-16
 * code units, so only an offset is needed.
 */
import type * as Monaco from "monaco-editor";

export type LspPosition = { line: number; character: number };
export type LspRange = { start: LspPosition; end: LspPosition };
export type MarkupContent = { kind: "plaintext" | "markdown"; value: string };
export type MarkedString = string | { language: string; value: string };

export type LspDiagnostic = {
    range: LspRange;
    /** 1 Error, 2 Warning, 3 Information, 4 Hint */
    severity?: 1 | 2 | 3 | 4;
    code?: string | number;
    source?: string;
    message: string;
};

export type LspTextEdit = { range: LspRange; newText: string };
export type LspInsertReplaceEdit = {
    insert: LspRange;
    replace: LspRange;
    newText: string;
};

export type LspCompletionItem = {
    label: string;
    kind?: number;
    detail?: string;
    documentation?: string | MarkupContent;
    sortText?: string;
    filterText?: string;
    insertText?: string;
    /** 1 PlainText, 2 Snippet */
    insertTextFormat?: 1 | 2;
    textEdit?: LspTextEdit | LspInsertReplaceEdit;
};

export type LspCompletionResult =
    | LspCompletionItem[]
    | { isIncomplete: boolean; items: LspCompletionItem[] }
    | null;

export type LspHover = {
    contents: MarkupContent | MarkedString | MarkedString[];
    range?: LspRange;
} | null;

export type LspSignatureHelp = {
    signatures: {
        label: string;
        documentation?: string | MarkupContent;
        parameters?: {
            label: string | [number, number];
            documentation?: string | MarkupContent;
        }[];
    }[];
    activeSignature?: number;
    activeParameter?: number;
} | null;

export type LspLocation = { uri: string; range: LspRange };
export type LspLocationLink = {
    targetUri: string;
    targetRange: LspRange;
    targetSelectionRange: LspRange;
};
export type LspDefinitionResult =
    | LspLocation
    | LspLocation[]
    | LspLocationLink[]
    | null;

export type ServerCapabilities = {
    completionProvider?: { triggerCharacters?: string[] };
    signatureHelpProvider?: { triggerCharacters?: string[] };
    hoverProvider?: boolean | object;
    definitionProvider?: boolean | object;
};

export function toMonacoRange(range: LspRange): Monaco.IRange {
    return {
        startLineNumber: range.start.line + 1,
        startColumn: range.start.character + 1,
        endLineNumber: range.end.line + 1,
        endColumn: range.end.character + 1,
    };
}

export function toLspPosition(position: Monaco.IPosition): LspPosition {
    return { line: position.lineNumber - 1, character: position.column - 1 };
}

/** Flattens any LSP documentation shape into Markdown. */
export function toMarkdown(
    content: string | MarkupContent | MarkedString | MarkedString[] | undefined,
): string | undefined {
    if (content === undefined) return undefined;
    if (Array.isArray(content)) {
        const parts = content.map(toMarkdown).filter(Boolean);
        return parts.length > 0 ? parts.join("\n\n") : undefined;
    }
    if (typeof content === "string") return content || undefined;
    if ("kind" in content) return content.value || undefined;
    return `\`\`\`${content.language}\n${content.value}\n\`\`\``;
}

type CompletionKindName = keyof typeof Monaco.languages.CompletionItemKind;

/** LSP CompletionItemKind (1-25) → Monaco's enum member of the same meaning. */
export const COMPLETION_KINDS: Record<number, CompletionKindName> = {
    1: "Text",
    2: "Method",
    3: "Function",
    4: "Constructor",
    5: "Field",
    6: "Variable",
    7: "Class",
    8: "Interface",
    9: "Module",
    10: "Property",
    11: "Unit",
    12: "Value",
    13: "Enum",
    14: "Keyword",
    15: "Snippet",
    16: "Color",
    17: "File",
    18: "Reference",
    19: "Folder",
    20: "EnumMember",
    21: "Constant",
    22: "Struct",
    23: "Event",
    24: "Operator",
    25: "TypeParameter",
};

type SeverityName = keyof typeof Monaco.MarkerSeverity;

/** LSP DiagnosticSeverity → Monaco MarkerSeverity member. Missing = Error. */
export function markerSeverityName(
    severity: LspDiagnostic["severity"],
): SeverityName {
    switch (severity) {
        case 2:
            return "Warning";
        case 3:
            return "Info";
        case 4:
            return "Hint";
        default:
            return "Error";
    }
}

export function completionItems(result: LspCompletionResult): {
    items: LspCompletionItem[];
    incomplete: boolean;
} {
    if (!result) return { items: [], incomplete: false };
    if (Array.isArray(result)) return { items: result, incomplete: false };
    return { items: result.items, incomplete: result.isIncomplete };
}

/** Range and text a completion should insert, per the LSP item. */
export function completionEdit(item: LspCompletionItem): {
    range?: Monaco.IRange;
    text: string;
} {
    const edit = item.textEdit;
    if (edit) {
        const range = "range" in edit ? edit.range : edit.replace;
        return { range: toMonacoRange(range), text: edit.newText };
    }
    return { text: item.insertText ?? item.label };
}

/** Normalizes the three shapes of a definition result to plain locations. */
export function definitionLocations(
    result: LspDefinitionResult,
): LspLocation[] {
    if (!result) return [];
    const list = Array.isArray(result) ? result : [result];
    return list.map((l) =>
        "targetUri" in l
            ? { uri: l.targetUri, range: l.targetSelectionRange }
            : l,
    );
}
