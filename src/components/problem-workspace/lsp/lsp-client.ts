import { CLIENT_WORKSPACE_URI, type LspTarget } from "~/lib/lsp/servers";
import { JsonRpcConnection } from "./json-rpc";
import type {
    LspCompletionItem,
    LspCompletionResult,
    LspDefinitionResult,
    LspDiagnostic,
    LspHover,
    LspPosition,
    LspSignatureHelp,
    ServerCapabilities,
} from "./protocol";

/** How long to wait for the WebSocket to open. */
const CONNECT_TIMEOUT_MS = 10_000;
/** jdtls can take a while to index the JDK on a cold start. */
const INITIALIZE_TIMEOUT_MS = 90_000;
const SHUTDOWN_TIMEOUT_MS = 2_000;

/** Close code the gateway uses for sessions closed after inactivity. */
export const CLOSE_IDLE = 4000;

type ConnectOptions = {
    url: string;
    token: string;
    target: LspTarget;
    /** Called if the connection drops after it was established. */
    onUnexpectedClose: (code: number) => void;
};

function openSocket(url: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
        const socket = new WebSocket(url);
        const timer = setTimeout(() => {
            socket.close();
            reject(new Error("timed out connecting to the LSP gateway"));
        }, CONNECT_TIMEOUT_MS);
        socket.addEventListener("open", () => {
            clearTimeout(timer);
            resolve(socket);
        });
        // A refused upgrade (bad token, capacity, …) fires error then close.
        socket.addEventListener("close", (event) => {
            clearTimeout(timer);
            reject(
                new Error(`LSP gateway closed the connection (${event.code})`),
            );
        });
    });
}

/**
 * Connects to a language server through the gateway and completes the LSP
 * handshake. Rejects if the gateway can't be reached or the server doesn't
 * initialize in time.
 */
export async function connectLsp(options: ConnectOptions): Promise<LspClient> {
    const socket = await openSocket(
        `${options.url}?token=${encodeURIComponent(options.token)}`,
    );

    let client: LspClient | undefined;
    const documentUri = `${CLIENT_WORKSPACE_URI}/${options.target.fileName}`;

    const connection = new JsonRpcConnection(socket, {
        onNotification(method, params) {
            if (method !== "textDocument/publishDiagnostics") return;
            const { uri, diagnostics } = params as {
                uri: string;
                diagnostics: LspDiagnostic[];
            };
            if (uri === documentUri) client?.onDiagnostics?.(diagnostics);
        },
        onRequest(method, params) {
            // One null per requested section = "use your defaults".
            if (method === "workspace/configuration") {
                const { items } = params as { items: unknown[] };
                return items.map(() => null);
            }
            // registerCapability, workDoneProgress/create, etc.
            return null;
        },
        onClose(event) {
            if (client && !client.disposed) {
                options.onUnexpectedClose(
                    client.simulatingIdle ? CLOSE_IDLE : event.code,
                );
            }
        },
    });

    try {
        const { capabilities } = await connection.request<{
            capabilities: ServerCapabilities;
        }>(
            "initialize",
            {
                processId: null,
                clientInfo: { name: "cs-uil-website" },
                rootUri: CLIENT_WORKSPACE_URI,
                workspaceFolders: [
                    { uri: CLIENT_WORKSPACE_URI, name: "workspace" },
                ],
                capabilities: {
                    workspace: { configuration: true, workspaceFolders: true },
                    textDocument: {
                        synchronization: { didSave: false },
                        completion: {
                            completionItem: {
                                snippetSupport: true,
                                documentationFormat: ["markdown", "plaintext"],
                            },
                        },
                        hover: { contentFormat: ["markdown", "plaintext"] },
                        signatureHelp: {
                            signatureInformation: {
                                documentationFormat: ["markdown", "plaintext"],
                                parameterInformation: {
                                    labelOffsetSupport: true,
                                },
                            },
                        },
                        definition: { linkSupport: true },
                        publishDiagnostics: {},
                    },
                },
            },
            INITIALIZE_TIMEOUT_MS,
        );
        connection.notify("initialized", {});
        client = new LspClient(
            connection,
            documentUri,
            options.target.languageId,
            capabilities,
        );
        return client;
    } catch (error) {
        connection.close();
        throw error;
    }
}

/** One open document on one language server. */
export class LspClient {
    disposed = false;
    /** Set by simulateIdleClose(); makes the close report as an idle timeout. */
    simulatingIdle = false;
    /** Set by whoever displays diagnostics (see bindLspToMonaco). */
    onDiagnostics?: (diagnostics: LspDiagnostic[]) => void;
    private version = 0;

    constructor(
        private readonly connection: JsonRpcConnection,
        readonly documentUri: string,
        private readonly languageId: string,
        readonly capabilities: ServerCapabilities,
    ) {}

    open(text: string): void {
        this.connection.notify("textDocument/didOpen", {
            textDocument: {
                uri: this.documentUri,
                languageId: this.languageId,
                version: ++this.version,
                text,
            },
        });
    }

    /** Sends the whole document; the gateway relies on full-text sync. */
    change(text: string): void {
        this.connection.notify("textDocument/didChange", {
            textDocument: { uri: this.documentUri, version: ++this.version },
            contentChanges: [{ text }],
        });
    }

    completion(position: LspPosition) {
        return this.connection.request<LspCompletionResult>(
            "textDocument/completion",
            this.at(position),
        );
    }

    resolveCompletion(item: LspCompletionItem) {
        return this.connection.request<LspCompletionItem>(
            "completionItem/resolve",
            item,
        );
    }

    hover(position: LspPosition) {
        return this.connection.request<LspHover>(
            "textDocument/hover",
            this.at(position),
        );
    }

    signatureHelp(position: LspPosition) {
        return this.connection.request<LspSignatureHelp>(
            "textDocument/signatureHelp",
            this.at(position),
        );
    }

    definition(position: LspPosition) {
        return this.connection.request<LspDefinitionResult>(
            "textDocument/definition",
            this.at(position),
        );
    }

    /**
     * For testing reconnection: drops the connection as if the gateway had
     * closed it for inactivity. The gateway ends the session just as it would
     * after a real timeout.
     */
    simulateIdleClose(): void {
        this.simulatingIdle = true;
        this.connection.close(CLOSE_IDLE);
    }

    /** Politely shuts the server down, then closes the socket. */
    async dispose(): Promise<void> {
        if (this.disposed) return;
        this.disposed = true;
        try {
            await this.connection.request(
                "shutdown",
                null,
                SHUTDOWN_TIMEOUT_MS,
            );
            this.connection.notify("exit", null);
        } catch {
            // Closing the socket makes the gateway kill the server anyway.
        }
        this.connection.close();
    }

    private at(position: LspPosition) {
        return { textDocument: { uri: this.documentUri }, position };
    }
}
