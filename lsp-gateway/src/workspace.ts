import { pathToFileURL } from "node:url";

/**
 * Workspace root the browser uses in URIs. Must match CLIENT_WORKSPACE_URI in
 * the website's `src/lib/lsp/servers.ts`.
 */
export const CLIENT_WORKSPACE_URI = "file:///workspace";

export function sessionWorkspaceUri(dir: string): string {
    return pathToFileURL(dir).href;
}

/**
 * Replaces every occurrence of `from` with `to` in the string values of a
 * JSON message. Used to swap the browser's placeholder workspace URI for the
 * session's real directory (and back), wherever it appears in a message.
 */
export function rewriteUris(value: unknown, from: string, to: string): unknown {
    if (typeof value === "string") return value.replaceAll(from, to);
    if (Array.isArray(value)) {
        return value.map((v) => rewriteUris(v, from, to));
    }
    if (value !== null && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value).map(([k, v]) => [
                k,
                rewriteUris(v, from, to),
            ]),
        );
    }
    return value;
}

type Message = { method?: string; params?: unknown };

const MAX_TAB_SIZE = 16;

/**
 * The indentation options of a formatting request, or undefined if it isn't
 * one or the options are malformed. They end up in a config file (see
 * `formattingFiles`), so only a small integer and a boolean get through.
 */
export function formattingOptions(
    message: Message,
): { tabSize: number; insertSpaces: boolean } | undefined {
    if (
        message.method !== "textDocument/formatting" &&
        message.method !== "textDocument/rangeFormatting"
    ) {
        return undefined;
    }
    const options = (message.params as { options?: unknown } | undefined)
        ?.options as { tabSize?: unknown; insertSpaces?: unknown } | undefined;
    const tabSize = options?.tabSize;
    const insertSpaces = options?.insertSpaces;
    if (
        typeof tabSize !== "number" ||
        !Number.isInteger(tabSize) ||
        tabSize < 1 ||
        tabSize > MAX_TAB_SIZE ||
        typeof insertSpaces !== "boolean"
    ) {
        return undefined;
    }
    return { tabSize, insertSpaces };
}

/**
 * If `message` opens or fully replaces a document inside the workspace,
 * returns the file name and new text so the gateway can mirror it to disk.
 * Some servers (jdtls in particular) only treat a file as part of the
 * project if it exists on disk.
 *
 * Only the server's own source files (`allowedFiles`, see `mirroredFiles`)
 * are mirrored, matched exactly, so a malicious URI can't write outside the
 * session directory or drop in build files the server would act on.
 */
export function documentToMirror(
    message: Message,
    allowedFiles: readonly string[],
): { fileName: string; text: string } | undefined {
    const params = message.params as
        | {
              textDocument?: { uri?: string; text?: string };
              contentChanges?: { text?: string; range?: unknown }[];
          }
        | undefined;
    const uri = params?.textDocument?.uri;
    if (!uri?.startsWith(`${CLIENT_WORKSPACE_URI}/`)) return undefined;

    const fileName = uri.slice(CLIENT_WORKSPACE_URI.length + 1);
    if (!allowedFiles.includes(fileName)) return undefined;

    if (message.method === "textDocument/didOpen") {
        const text = params?.textDocument?.text;
        return typeof text === "string" ? { fileName, text } : undefined;
    }
    if (message.method === "textDocument/didChange") {
        // Only full-document syncs carry the whole text; the editor uses
        // those exclusively.
        const last = params?.contentChanges?.at(-1);
        if (last && !last.range && typeof last.text === "string") {
            return { fileName, text: last.text };
        }
    }
    return undefined;
}
