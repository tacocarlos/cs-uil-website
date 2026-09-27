import { useEffect, useRef, useState } from "react";
import type { Monaco } from "@monaco-editor/react";
import type { editor, IDisposable } from "monaco-editor";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { lspTargetFor } from "~/lib/lsp/servers";
import { languageFamily, type LanguageConfig } from "../languages";
import { onNextActivity } from "./activity";
import { exposeLspDebug } from "./debug";
import { bindLspToMonaco } from "./monaco-lsp";
import { CLOSE_IDLE, connectLsp, type LspClient } from "./lsp-client";

/**
 * - off: no language server for this language, the gateway isn't configured,
 *   or the user isn't signed in
 * - connecting: starting the language server (Java can take a few seconds)
 * - ready: code intelligence is on
 * - paused: the gateway closed the session after inactivity; reconnects the
 *   next time the user types or clicks into the editor
 * - unavailable: couldn't connect or lost the connection; syntax
 *   highlighting only
 */
export type LspStatus =
    | "off"
    | "connecting"
    | "ready"
    | "paused"
    | "unavailable";

/**
 * Connects the editor to a language server for the current language, and
 * reconnects when the language changes. After an idle timeout it pauses and
 * reconnects on the user's next activity; any other failure degrades to plain
 * syntax highlighting with a toast. The editor itself keeps working
 * throughout.
 */
export function useLsp(
    codeEditor: editor.IStandaloneCodeEditor | null,
    monaco: Monaco | null,
    language: LanguageConfig,
): LspStatus {
    const [status, setStatus] = useState<LspStatus>("off");
    // Bumped to reconnect after an idle pause; re-runs the effect below.
    const [resumeCount, setResumeCount] = useState(0);
    const { mutateAsync: getSession } = api.lsp.getSession.useMutation();
    // Keep the effect keyed on the language only; the mutation function's
    // identity isn't meaningful.
    const getSessionRef = useRef(getSession);
    getSessionRef.current = getSession;

    useEffect(() => {
        const family = languageFamily(language.name);
        const target = lspTargetFor(family);
        if (!codeEditor || !monaco || !target) {
            setStatus("off");
            return;
        }

        let cancelled = false;
        let client: LspClient | undefined;
        let binding: IDisposable | undefined;
        let waitingForActivity: IDisposable | undefined;
        let removeDebug: (() => void) | undefined;

        const degrade = (title: string, description: string) => {
            removeDebug?.();
            binding?.dispose();
            binding = undefined;
            if (cancelled) return;
            setStatus("unavailable");
            toast.warning(title, { description });
        };

        // The gateway frees idle sessions (a Java server holds hundreds of MB),
        // so don't reconnect right away: wait until the user is back.
        const pause = () => {
            removeDebug?.();
            binding?.dispose();
            binding = undefined;
            if (cancelled) return;
            setStatus("paused");
            waitingForActivity = onNextActivity(codeEditor, () =>
                setResumeCount((n) => n + 1),
            );
        };

        setStatus("connecting");
        void (async () => {
            let session: Awaited<ReturnType<typeof getSession>>;
            try {
                session = await getSessionRef.current({
                    server: target.server,
                });
            } catch {
                degrade(
                    `Code intelligence unavailable for ${family}`,
                    "Couldn't reach the server. Syntax highlighting still works.",
                );
                return;
            }
            if (cancelled) return;
            // Not configured, or not signed in: quietly run without LSP.
            if (!session) {
                setStatus("off");
                return;
            }

            try {
                client = await connectLsp({
                    ...session,
                    target,
                    onUnexpectedClose: (code) =>
                        code === CLOSE_IDLE
                            ? pause()
                            : degrade(
                                  `${family} code intelligence disconnected`,
                                  "Lost the connection to the language server. Syntax highlighting still works.",
                              ),
                });
            } catch {
                degrade(
                    `Code intelligence unavailable for ${family}`,
                    "Couldn't connect to the language server. Syntax highlighting still works.",
                );
                return;
            }

            if (cancelled) {
                void client.dispose();
                return;
            }
            binding = bindLspToMonaco(
                monaco,
                codeEditor,
                client,
                language.monacoLang,
            );
            // Next.js inlines NODE_ENV, so this is stripped from production.
            if (process.env.NODE_ENV === "development") {
                removeDebug = exposeLspDebug(client);
            }
            setStatus("ready");
        })();

        return () => {
            cancelled = true;
            removeDebug?.();
            waitingForActivity?.dispose();
            binding?.dispose();
            void client?.dispose();
        };
    }, [
        codeEditor,
        monaco,
        language.id,
        language.name,
        language.monacoLang,
        resumeCount,
    ]);

    return status;
}
