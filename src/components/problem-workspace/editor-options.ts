import { useState } from "react";
import { usePersistedStateJSON } from "./use-persisted-state";

const DEFAULT_EDITOR_OPTIONS = {
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

type EditorOptions = typeof DEFAULT_EDITOR_OPTIONS;

export function useEditorOptions() {
    const [options, setOptions] = usePersistedStateJSON<EditorOptions>("editor-options", DEFAULT_EDITOR_OPTIONS);
    const setters = {
        setFontSize: (newFontSize: number) => {
            setOptions((prev) => ({ ...prev, fontSize: newFontSize }));
        }
    }
    
    return [options , setters] as const;
}