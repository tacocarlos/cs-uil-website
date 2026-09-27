import { Button } from "~/components/ui/button";
import { LanguagePicker } from "./language-picker";
import { LspStatusBadge } from "./lsp/lsp-badges";
import type { CodeEditorState } from "./use-code-editor";

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
            variant="ghost"
            size="sm"
            className="text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
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
