import { basename } from "node:path";
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

/**
 * If `message` opens or fully replaces a document inside the workspace,
 * returns the file name and new text so the gateway can mirror it to disk.
 * Some servers (jdtls in particular) only treat a file as part of the
 * project if it exists on disk.
 *
 * Only top-level files are mirrored, and only by base name, so a malicious
 * URI can't write outside the session directory.
 */
export function documentToMirror(
    message: Message,
): { fileName: string; text: string } | undefined {
    const params = message.params as
        | {
              textDocument?: { uri?: string; text?: string };
              contentChanges?: { text?: string; range?: unknown }[];
          }
        | undefined;
    const uri = params?.textDocument?.uri;
    if (!uri?.startsWith(`${CLIENT_WORKSPACE_URI}/`)) return undefined;

    const relative = uri.slice(CLIENT_WORKSPACE_URI.length + 1);
    const fileName = basename(decodeURIComponent(relative));
    if (!fileName || fileName !== relative || fileName.startsWith(".")) {
        return undefined;
    }

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
