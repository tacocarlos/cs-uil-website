import { Editor as MonacoEditor, type Monaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";

export default function Editor({
    handleEditorDidMount,
    starterCode,
}: {
    handleEditorDidMount: (
        editor: editor.IStandaloneCodeEditor,
        monaco: Monaco,
    ) => void;
    starterCode: string;
}) {
    return (
        <MonacoEditor
            className="rounded-md bg-stone-800 p-2"
            theme="vs-dark"
            defaultLanguage="java"
            height="100%"
            language="java"
            options={{
                automaticLayout: true,
            }}
            onMount={handleEditorDidMount}
            defaultValue={starterCode}
        />
    );
}
