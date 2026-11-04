import { useEffect, useRef, useState } from "react";
import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { toast } from "sonner";
import { DEFAULT_LANGUAGE_ID, findLanguage } from "./languages";
import { useLsp } from "./lsp/use-lsp";
import { useLanguages, type LanguageOptions } from "./use-languages";
import {
    readStorage,
    useHydrated,
    usePersistedState,
    writeStorage,
} from "./use-persisted-state";
import { useEditorOptions } from "./editor-options";
import { DEFAULT_THEME_ID, findTheme, loadThemeData } from "./editor-themes";
import { registerPythonFormatter } from "./python-format";

/**
 * Owns the Monaco instance and the selected language. Code is saved to
 * localStorage per language (`<storagePrefix>-code-<languageId>`) so switching
 * languages never loses work.
 *
 * Don't mount the editor until `isReady`: the saved language may not be in
 * the fallback list, or (while hydrating) not read yet, and mounting early
 * would load the wrong code. Monaco only uses the first `onMount` it gets.
 */
export function useCodeEditor(
    storagePrefix: string,
    languageOptions?: LanguageOptions,
) {
    const { languages, isReady: languagesReady } =
        useLanguages(languageOptions);
    // Saved settings render as their defaults until hydration finishes.
    const hydrated = useHydrated();
    const isReady = languagesReady && hydrated;
    const [savedLanguageId, setLanguageId] = usePersistedState(
        `${storagePrefix}-language`,
        DEFAULT_LANGUAGE_ID,
    );
    // Falls back to the default if the saved language isn't on this Judge0.
    const language = findLanguage(languages, savedLanguageId);

    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    // State (not just a ref) so the LSP connection starts once Monaco mounts.
    const [mounted, setMounted] = useState<{
        editor: editor.IStandaloneCodeEditor;
        monaco: Monaco;
    } | null>(null);
    const lspStatus = useLsp(
        mounted?.editor ?? null,
        mounted?.monaco ?? null,
        language,
    );

    const [options, setOptions] = useEditorOptions();

    // Saved apart from `options`, which go straight to Monaco: it would
    // switch to a monaco-themes theme before it's been loaded and defined.
    const [savedThemeId, setThemeId] = usePersistedState(
        "editor-theme",
        DEFAULT_THEME_ID,
    );
    const theme = findTheme(savedThemeId);
    // The monaco-themes theme most recently defined in Monaco.
    const [definedThemeId, setDefinedThemeId] = useState<string | null>(null);
    // What Monaco shows: the chosen theme once it's defined. Until then the
    // previous theme if it's the same kind (light/dark), else a built-in of
    // that kind, so switching never flashes the other kind.
    const shownThemeId =
        !theme.load || definedThemeId === theme.id
            ? theme.id
            : definedThemeId && findTheme(definedThemeId).kind === theme.kind
              ? definedThemeId
              : theme.kind === "light"
                ? "vs"
                : "vs-dark";
    useEffect(() => {
        const data = loadThemeData(theme);
        if (!data || !mounted) return;
        let current = true;
        data.then(
            (themeData) => {
                if (!current) return; // the student picked another
                mounted.monaco.editor.defineTheme(theme.id, themeData);
                setDefinedThemeId(theme.id);
            },
            () => {
                if (current) toast(`Couldn't load the ${theme.name} theme.`);
            },
        );
        return () => {
            current = false;
        };
    }, [mounted, theme]);

    // Indentation belongs to the document (model), not the editor, and the
    // formatters read it from there, so apply changes to the model directly.
    const { tabSize, insertSpaces } = options;
    useEffect(() => {
        mounted?.editor.getModel()?.updateOptions({ tabSize, insertSpaces });
    }, [mounted, tabSize, insertSpaces]);

    // The change listener is registered once on mount, so it reads the active
    // language through a ref rather than the (stale) closure value.
    const languageIdRef = useRef(language.id);

    const codeKey = (id: string) => `${storagePrefix}-code-${id}`;
    const savedCodeOrStarter = (id: string) =>
        readStorage(codeKey(id)) ?? findLanguage(languages, id).starterCode;

    function onMount(instance: editor.IStandaloneCodeEditor, monaco: Monaco) {
        languageIdRef.current = language.id;
        registerPythonFormatter(monaco);
        instance.setValue(savedCodeOrStarter(language.id));
        instance.onDidChangeModelContent(() => {
            writeStorage(codeKey(languageIdRef.current), instance.getValue());
        });
        editorRef.current = instance;
        setMounted({ editor: instance, monaco });
        toast("Editor initialized.");
    }

    function changeLanguage(newId: string) {
        // Advance the ref BEFORE setValue so the synchronous change listener
        // saves the restored code under the new language's key.
        languageIdRef.current = newId;
        editorRef.current?.setValue(savedCodeOrStarter(newId));
        setLanguageId(newId);
    }

    /** Current editor contents, or null (with a toast) if Monaco hasn't mounted. */
    function getCode(): string | null {
        if (!editorRef.current) {
            toast("Editor is not initialized.");
            return null;
        }
        return editorRef.current.getValue();
    }

    function resetCode() {
        editorRef.current?.setValue(language.starterCode);
    }

    // Python formats in the browser (see python-format.ts); other languages
    // format through their language server, so only while it's connected.
    const formatter: "ready" | "waiting" | "none" =
        language.monacoLang === "python" || lspStatus === "ready"
            ? "ready"
            : language.hasLsp
              ? "waiting"
              : "none";

    /** Runs Monaco's "Format Document", the same as Shift+Alt+F. */
    function formatCode() {
        const instance = editorRef.current;
        if (!instance) return;
        instance.focus();
        void instance.getAction("editor.action.formatDocument")?.run();
    }

    return {
        language,
        languages,
        isReady,
        lspStatus,
        changeLanguage,
        onMount,
        getCode,
        resetCode,
        formatter,
        formatCode,
        theme,
        shownThemeId,
        setThemeId,
        options,
        setOptions,
    };
}

export type CodeEditorState = ReturnType<typeof useCodeEditor>;
