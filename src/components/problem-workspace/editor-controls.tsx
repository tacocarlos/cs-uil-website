import { Button } from "~/components/ui/button";
import { LanguagePicker } from "./language-picker";
import { LspStatusBadge } from "./lsp/lsp-badges";
import type { CodeEditorState } from "./use-code-editor";
import { Input } from "../ui/input";

/** Language picker, plus the LSP status for languages that support it. */
export function LanguageSelect({ editor }: { editor: CodeEditorState }) {
    return (
        <div className="flex items-center gap-2">
            <LanguagePicker editor={editor} />
            {editor.language.hasLsp && (
                <LspStatusBadge status={editor.lspStatus} />
            )}
        </div>
    );
}

export function ResetCodeButton({ editor }: { editor: CodeEditorState }) {
    return (
        <Button
            variant="destructive"
            size="sm"
            className="text-sm hover:motion-preset-seesaw"
            onClick={() => {
                const confirmed = confirm(
                    "This action will reset your code editor, and ALL PROGRESS WILL BE LOST. Are you sure?",
                );
                if (confirmed) editor.resetCode();
            }}
        >
            Reset Code
        </Button>
    );
}

export function RunButton({
    onRun,
    isRunning,
}: {
    onRun: () => void;
    isRunning: boolean;
}) {
    return (
        <Button
            variant="outline"
            onClick={onRun}
            disabled={isRunning}
            className="border-slate-600 bg-slate-700 text-white hover:bg-slate-600"
        >
            {isRunning ? "Running..." : "Run"}
        </Button>
    );
}

export function ChangeFontSizeButton({
    editor,
    delta,
    ...props
}: {
    editor: CodeEditorState;
    delta: number;
} & React.ComponentProps<typeof Button>) {
    return (
        <Button
            {...props}
            variant="outline"
            onClick={() => {
                const newFontSize = Math.max(8, editor.options.fontSize + delta);
                editor.setOptions.setFontSize(newFontSize);
            }}
            className="border-slate-600 bg-slate-700 text-white hover:bg-slate-600"
        >
            {delta > 0 ? "+" : "-"}
        </Button>
    );
}

export function ChangeFontSizeSelector({ editor }: { editor: CodeEditorState }) {
    return (
        <span className="flex items-center gap-2 px-2 py-1 text-sm">
            <p className="text-slate-300">Font Size:</p>
            <ChangeFontSizeButton disabled={editor.options.fontSize <= 8} editor={editor} delta={-1} />
            <Input
                type="number"
                min={8}
                max={50}
                step={1}
                value={editor.options.fontSize}
                onChange={(e) => {
                    const newFontSize = parseInt(e.target.value, 10);
                    editor.setOptions.setFontSize(newFontSize);
                }}
                className="rounded bg-slate-700 px-2 py-1 text-sm text-white hover:bg-slate-600"
            />
            <ChangeFontSizeButton disabled={editor.options.fontSize >= 50} editor={editor} delta={1} />
        </span>
    );
}

export function SubmitButton({
    onSubmit,
    isSubmitting,
    disabledReason,
}: {
    onSubmit: () => void;
    isSubmitting: boolean;
    /** When set, the button is disabled and shows this text instead of "Submit". */
    disabledReason?: string;
}) {
    return (
        <Button
            onClick={onSubmit}
            disabled={isSubmitting || disabledReason !== undefined}
            title={disabledReason}
            className="bg-green-600 text-white hover:bg-green-700 disabled:bg-slate-600"
        >
            {isSubmitting ? "Submitting..." : (disabledReason ?? "Submit")}
        </Button>
    );
}
