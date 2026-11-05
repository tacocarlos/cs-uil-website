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
            variant="destructive"
            size="sm"
            className="hover:animate-seesaw text-sm"
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
        <Button variant="outline" onClick={onRun} disabled={isRunning}>
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
            className="bg-success text-success-foreground hover:bg-success/90"
        >
            {isSubmitting ? "Submitting..." : (disabledReason ?? "Submit")}
        </Button>
    );
}
