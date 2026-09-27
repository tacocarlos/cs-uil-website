import { useRef, useState } from "react";
import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { toast } from "sonner";
import { DEFAULT_LANGUAGE_ID, findLanguage } from "./languages";
import { useLsp } from "./lsp/use-lsp";
import { useLanguages, type LanguageOptions } from "./use-languages";
import { usePersistedState } from "./use-persisted-state";

/**
 * Owns the Monaco instance and the selected language. Code is saved to
 * localStorage per language (`<storagePrefix>-code-<languageId>`) so switching
 * languages never loses work.
 *
 * Don't mount the editor until `isReady`: the saved language may not be in
 * the fallback list, and mounting early would load the wrong starter code.
 */
export function useCodeEditor(
    storagePrefix: string,
    languageOptions?: LanguageOptions,
) {
    const { languages, isReady } = useLanguages(languageOptions);
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

    // The change listener is registered once on mount, so it reads the active
    // language through a ref rather than the (stale) closure value.
    const languageIdRef = useRef(language.id);

    const codeKey = (id: string) => `${storagePrefix}-code-${id}`;
    const savedCodeOrStarter = (id: string) =>
        window.localStorage.getItem(codeKey(id)) ??
        findLanguage(languages, id).starterCode;

    function onMount(instance: editor.IStandaloneCodeEditor, monaco: Monaco) {
        languageIdRef.current = language.id;
        instance.setValue(savedCodeOrStarter(language.id));
        instance.onDidChangeModelContent(() => {
            window.localStorage.setItem(
                codeKey(languageIdRef.current),
                instance.getValue(),
            );
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

    return {
        language,
        languages,
        isReady,
        lspStatus,
        changeLanguage,
        onMount,
        getCode,
        resetCode,
    };
}

export type CodeEditorState = ReturnType<typeof useCodeEditor>;
