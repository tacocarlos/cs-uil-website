/**
 * Minimal JSON-RPC 2.0 over a WebSocket, one message per frame (the LSP
 * gateway handles the stdio framing on the server side).
 */

/** The parts of a WebSocket this needs; lets tests pass a fake. */
export type SocketLike = {
    send(data: string): void;
    close(code?: number, reason?: string): void;
    addEventListener(
        type: "message",
        listener: (event: { data: unknown }) => void,
    ): void;
    addEventListener(
        type: "close",
        listener: (event: { code: number; reason: string }) => void,
    ): void;
};

type Handlers = {
    /** Server → client notifications, e.g. publishDiagnostics. */
    onNotification: (method: string, params: unknown) => void;
    /** Server → client requests; the return value is sent as the result. */
    onRequest: (method: string, params: unknown) => unknown;
    onClose: (event: { code: number; reason: string }) => void;
};

type Message = {
    id?: number | string | null;
    method?: string;
    params?: unknown;
    result?: unknown;
    error?: { code: number; message: string };
};

type Pending = {
    resolve: (result: unknown) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
};

export class JsonRpcError extends Error {
    constructor(
        message: string,
        readonly code?: number,
    ) {
        super(message);
    }
}

export class JsonRpcConnection {
    private nextId = 1;
    private readonly pending = new Map<number, Pending>();
    private closed = false;

    constructor(
        private readonly socket: SocketLike,
        private readonly handlers: Handlers,
    ) {
        socket.addEventListener("message", (event) =>
            this.handle(String(event.data)),
        );
        socket.addEventListener("close", (event) => {
            this.closed = true;
            for (const p of this.pending.values()) {
                clearTimeout(p.timer);
                p.reject(new JsonRpcError("connection closed"));
            }
            this.pending.clear();
            handlers.onClose(event);
        });
    }

    request<T>(
        method: string,
        params: unknown,
        timeoutMs = 30_000,
    ): Promise<T> {
        if (this.closed) {
            return Promise.reject(new JsonRpcError("connection closed"));
        }
        const id = this.nextId++;
        return new Promise<T>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(id);
                reject(new JsonRpcError(`${method} timed out`));
            }, timeoutMs);
            this.pending.set(id, {
                resolve: (result) => resolve(result as T),
                reject,
                timer,
            });
            this.send({ jsonrpc: "2.0", id, method, params });
        });
    }

    notify(method: string, params: unknown): void {
        if (!this.closed) this.send({ jsonrpc: "2.0", method, params });
    }

    close(code = 1000): void {
        if (!this.closed) this.socket.close(code);
    }

    private send(message: object): void {
        this.socket.send(JSON.stringify(message));
    }

    private handle(raw: string): void {
        let message: Message;
        try {
            message = JSON.parse(raw) as Message;
        } catch {
            return;
        }

        if (message.method === undefined) {
            // A response to one of our requests.
            const pending =
                typeof message.id === "number"
                    ? this.pending.get(message.id)
                    : undefined;
            if (!pending) return;
            this.pending.delete(message.id as number);
            clearTimeout(pending.timer);
            if (message.error) {
                pending.reject(
                    new JsonRpcError(message.error.message, message.error.code),
                );
            } else {
                pending.resolve(message.result ?? null);
            }
            return;
        }

        if (message.id === undefined || message.id === null) {
            this.handlers.onNotification(message.method, message.params);
            return;
        }

        // Servers block on some requests (e.g. workspace/configuration), so
        // always answer, even if the handler has nothing useful to say.
        let result: unknown = null;
        try {
            result = this.handlers.onRequest(message.method, message.params);
        } catch {
            result = null;
        }
        this.send({ jsonrpc: "2.0", id: message.id, result: result ?? null });
    }
}
