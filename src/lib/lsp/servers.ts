/**
 * Language servers the LSP gateway can run, and which language families use
 * them. Shared by the tRPC router (to validate requests) and the editor (to
 * decide whether to connect). Must match `lsp-gateway/src/servers.ts`.
 */
export const LSP_SERVER_IDS = ["java", "python", "clangd"] as const;
export type LspServerId = (typeof LSP_SERVER_IDS)[number];

export type LspTarget = {
    server: LspServerId;
    /** LSP `languageId` sent in `textDocument/didOpen` */
    languageId: string;
    /** Name the file gets in the session workspace */
    fileName: string;
};

/** Keyed by language family, e.g. "C++" (see `languageFamily`). */
const LSP_TARGETS: Record<string, LspTarget> = {
    Java: { server: "java", languageId: "java", fileName: "Main.java" },
    Python: { server: "python", languageId: "python", fileName: "main.py" },
    C: { server: "clangd", languageId: "c", fileName: "main.c" },
    "C++": { server: "clangd", languageId: "cpp", fileName: "main.cpp" },
};

export function lspTargetFor(family: string): LspTarget | undefined {
    return LSP_TARGETS[family];
}

/**
 * Workspace root the editor uses in document URIs. The gateway rewrites it
 * to each session's real directory, so the browser never needs to know
 * server paths.
 */
export const CLIENT_WORKSPACE_URI = "file:///workspace";
