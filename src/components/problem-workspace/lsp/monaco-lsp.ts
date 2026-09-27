import type { Monaco } from "@monaco-editor/react";
import type { editor, IDisposable, languages } from "monaco-editor";
import type { LspClient } from "./lsp-client";
import {
    COMPLETION_KINDS,
    completionEdit,
    completionItems,
    definitionLocations,
    markerSeverityName,
    toLspPosition,
    toMarkdown,
    toMonacoRange,
    type LspCompletionItem,
} from "./protocol";

const MARKER_OWNER = "lsp";
/** Batch keystrokes into one didChange. */
const CHANGE_DEBOUNCE_MS = 150;

/**
 * Wires an LSP client to the editor's current model: document sync,
 * diagnostics, completion, hover, signature help, and go-to-definition.
 * Disposing removes everything, leaving plain syntax highlighting.
 */
export function bindLspToMonaco(
    monaco: Monaco,
    codeEditor: editor.IStandaloneCodeEditor,
    client: LspClient,
    monacoLanguage: string,
): IDisposable {
    const model = codeEditor.getModel();
    if (!model) return { dispose: () => undefined };

    client.open(model.getValue());

    // ── Document sync ───────────────────────────────────────────────────
    let changeTimer: ReturnType<typeof setTimeout> | undefined;
    let changePending = false;
    const flushChanges = () => {
        clearTimeout(changeTimer);
        if (changePending) {
            changePending = false;
            client.change(model.getValue());
        }
    };
    const changeListener = model.onDidChangeContent(() => {
        changePending = true;
        clearTimeout(changeTimer);
        changeTimer = setTimeout(flushChanges, CHANGE_DEBOUNCE_MS);
    });

    // ── Diagnostics ─────────────────────────────────────────────────────
    client.onDiagnostics = (diagnostics) => {
        monaco.editor.setModelMarkers(
            model,
            MARKER_OWNER,
            diagnostics.map((d) => ({
                ...toMonacoRange(d.range),
                message: d.message,
                severity: monaco.MarkerSeverity[markerSeverityName(d.severity)],
                source: d.source,
                code: d.code === undefined ? undefined : String(d.code),
            })),
        );
    };

    // Providers are registered per language, not per model, so each one
    // checks it's being asked about our model.
    const isOurs = (m: editor.ITextModel) => m === model;
    const caps = client.capabilities;
    const disposables: IDisposable[] = [changeListener];

    // ── Completion ──────────────────────────────────────────────────────
    if (caps.completionProvider) {
        disposables.push(
            monaco.languages.registerCompletionItemProvider(monacoLanguage, {
                triggerCharacters: caps.completionProvider.triggerCharacters,
                async provideCompletionItems(m, position) {
                    if (!isOurs(m)) return undefined;
                    flushChanges();
                    const { items, incomplete } = completionItems(
                        await client.completion(toLspPosition(position)),
                    );
                    const word = m.getWordUntilPosition(position);
                    const defaultRange = {
                        startLineNumber: position.lineNumber,
                        endLineNumber: position.lineNumber,
                        startColumn: word.startColumn,
                        endColumn: word.endColumn,
                    };
                    return {
                        incomplete,
                        suggestions: items.map((item) =>
                            toSuggestion(monaco, item, defaultRange),
                        ),
                    };
                },
            }),
        );
    }

    // ── Hover ───────────────────────────────────────────────────────────
    if (caps.hoverProvider) {
        disposables.push(
            monaco.languages.registerHoverProvider(monacoLanguage, {
                async provideHover(m, position) {
                    if (!isOurs(m)) return undefined;
                    flushChanges();
                    const hover = await client.hover(toLspPosition(position));
                    const markdown = hover && toMarkdown(hover.contents);
                    if (!markdown) return undefined;
                    return {
                        contents: [{ value: markdown }],
                        range: hover.range && toMonacoRange(hover.range),
                    };
                },
            }),
        );
    }

    // ── Signature help ──────────────────────────────────────────────────
    if (caps.signatureHelpProvider) {
        disposables.push(
            monaco.languages.registerSignatureHelpProvider(monacoLanguage, {
                signatureHelpTriggerCharacters:
                    caps.signatureHelpProvider.triggerCharacters,
                async provideSignatureHelp(m, position) {
                    if (!isOurs(m)) return undefined;
                    flushChanges();
                    const help = await client.signatureHelp(
                        toLspPosition(position),
                    );
                    if (!help || help.signatures.length === 0) return undefined;
                    return {
                        value: {
                            activeSignature: help.activeSignature ?? 0,
                            activeParameter: help.activeParameter ?? 0,
                            signatures: help.signatures.map((s) => ({
                                label: s.label,
                                documentation: markdownString(s.documentation),
                                parameters: (s.parameters ?? []).map((p) => ({
                                    label: p.label,
                                    documentation: markdownString(
                                        p.documentation,
                                    ),
                                })),
                            })),
                        },
                        dispose: () => undefined,
                    };
                },
            }),
        );
    }

    // ── Go to definition (within the student's file only) ───────────────
    if (caps.definitionProvider) {
        disposables.push(
            monaco.languages.registerDefinitionProvider(monacoLanguage, {
                async provideDefinition(m, position) {
                    if (!isOurs(m)) return undefined;
                    flushChanges();
                    // Library definitions (e.g. JDK sources) live on the
                    // server and can't be opened here, so they're skipped.
                    return definitionLocations(
                        await client.definition(toLspPosition(position)),
                    )
                        .filter((l) => l.uri === client.documentUri)
                        .map((l) => ({
                            uri: model.uri,
                            range: toMonacoRange(l.range),
                        }));
                },
            }),
        );
    }

    return {
        dispose() {
            clearTimeout(changeTimer);
            client.onDiagnostics = undefined;
            for (const d of disposables) d.dispose();
            if (!model.isDisposed()) {
                monaco.editor.setModelMarkers(model, MARKER_OWNER, []);
            }
        },
    };
}

function markdownString(
    content: Parameters<typeof toMarkdown>[0],
): { value: string } | undefined {
    const value = toMarkdown(content);
    return value ? { value } : undefined;
}

function toSuggestion(
    monaco: Monaco,
    item: LspCompletionItem,
    defaultRange: languages.CompletionItem["range"],
): languages.CompletionItem {
    const { range, text } = completionEdit(item);
    const kindName = item.kind ? COMPLETION_KINDS[item.kind] : undefined;
    return {
        label: item.label,
        kind: monaco.languages.CompletionItemKind[kindName ?? "Text"],
        detail: item.detail,
        documentation: markdownString(item.documentation),
        sortText: item.sortText,
        filterText: item.filterText,
        insertText: text,
        insertTextRules:
            item.insertTextFormat === 2
                ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                : undefined,
        range: range ?? defaultRange,
    };
}
