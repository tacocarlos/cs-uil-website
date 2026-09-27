import type { LspClient } from "./lsp-client";

/** Development-only console hooks for testing the LSP connection. */
type LspDebug = {
    /**
     * Drops the connection as if the gateway timed it out for inactivity,
     * after `delaySeconds` (default: now). The editor should pause, then
     * reconnect when you type or click into it.
     */
    simulateIdle(delaySeconds?: number): void;
};

declare global {
    interface Window {
        __lsp?: LspDebug;
    }
}

let announced = false;

/** Exposes `window.__lsp` for `client`; returns a function that removes it. */
export function exposeLspDebug(client: LspClient): () => void {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const debug: LspDebug = {
        simulateIdle(delaySeconds = 0) {
            clearTimeout(timer);
            console.info(
                `[lsp] simulating an idle timeout${delaySeconds > 0 ? ` in ${delaySeconds}s` : ""}`,
            );
            timer = setTimeout(
                () => client.simulateIdleClose(),
                delaySeconds * 1000,
            );
        },
    };
    window.__lsp = debug;

    if (!announced) {
        announced = true;
        console.info(
            "[lsp] dev: window.__lsp.simulateIdle(seconds?) drops the connection like an idle timeout",
        );
    }

    return () => {
        clearTimeout(timer);
        if (window.__lsp === debug) delete window.__lsp;
    };
}
