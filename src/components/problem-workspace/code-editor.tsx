import { Editor } from "@monaco-editor/react";
import type { CodeEditorState } from "./use-code-editor";

const EDITOR_OPTIONS = {
    automaticLayout: true,
    fontSize: 14,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
    padding: { top: 16, bottom: 16 },
    lineHeight: 1.6,
    // Render hover, completion, and signature popups position: fixed so
    // they can extend past the editor. Otherwise the resizable panels'
    // overflow: hidden clips them near the pane's edges. (Requires that no
    // ancestor uses transform/filter, which would re-anchor fixed elements.)
    fixedOverflowWidgets: true,
};

export function CodeEditor({ editor }: { editor: CodeEditorState }) {
    if (!editor.isReady) {
        return (
            <div className="flex h-full items-center justify-center bg-[#1e1e1e] text-sm text-slate-400">
                Loading languages…
            </div>
        );
    }

    return (
        <Editor
            theme="vs-dark"
            height="100%"
            language={editor.language.monacoLang}
            defaultValue={editor.language.starterCode}
            options={EDITOR_OPTIONS}
            onMount={editor.onMount}
        />
    );
}
