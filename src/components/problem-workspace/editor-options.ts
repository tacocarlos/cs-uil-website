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
    // Indentation for typing and formatting: 4 spaces unless the student
    // changes it. Monaco would otherwise guess from the code's existing
    // indentation, so starter code would decide.
    tabSize: 4,
    insertSpaces: true,
    detectIndentation: false,
};

export const TAB_SIZES = [2, 4, 8] as const;

type EditorOptions = typeof DEFAULT_EDITOR_OPTIONS;

export function useEditorOptions() {
    // iOS zooms the page when an input under 16px gets focus, so phones
    // start at 16px.
    const isPhone = typeof window !== "undefined" && window.innerWidth < 768;
    const defaults = isPhone
        ? { ...DEFAULT_EDITOR_OPTIONS, fontSize: 16 }
        : DEFAULT_EDITOR_OPTIONS;
    const [saved, setSaved] = usePersistedStateJSON<Partial<EditorOptions>>(
        "editor-options",
        defaults,
    );
    // Options saved before a setting existed don't have it.
    const options: EditorOptions = { ...defaults, ...saved };
    const setOptions = (update: (prev: EditorOptions) => EditorOptions) => {
        setSaved((prev) => update({ ...defaults, ...prev }));
    };
    const setters = {
        setTabSize: (tabSize: number) => {
            setOptions((prev) => ({ ...prev, tabSize }));
        },

        setInsertSpaces: (insertSpaces: boolean) => {
            setOptions((prev) => ({ ...prev, insertSpaces }));
        },

        setFontSize: (newFontSize: number) => {
            setOptions((prev) => ({ ...prev, fontSize: newFontSize }));
        },

        toggleMinimap: () => {
            setOptions((prev) => ({
                ...prev,
                minimap: { enabled: !prev.minimap.enabled },
            }));
        },

        setTopPadding: (newPadding: number) => {
            setOptions((prev) => ({
                ...prev,
                padding: {
                    top: newPadding,
                    bottom: prev.padding.bottom,
                },
            }));
        },

        setBottom: (newPadding: number) => {
            setOptions((prev) => ({
                ...prev,
                padding: {
                    top: prev.padding.top,
                    bottom: newPadding,
                },
            }));
        },
    };

    return [options, setters] as const;
}
