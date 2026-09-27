import { mkdirSync, writeFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Subprocess } from "bun";
import type { Config } from "./config";
import { encodeMessage, MessageReader } from "./framing";
import { projectFiles, serverCommand } from "./servers";
import {
    CLIENT_WORKSPACE_URI,
    documentToMirror,
    rewriteUris,
    sessionWorkspaceUri,
} from "./workspace";

/** WebSocket close codes the editor distinguishes (4000–4999 are app-defined). */
export const CLOSE_IDLE = 4000;
export const CLOSE_SERVER_EXITED = 4001;

const KILL_GRACE_MS = 5_000;

type Callbacks = {
    /** Send a JSON message to the browser. */
    send: (json: string) => void;
    /** Close the browser connection. */
    close: (code: number, reason: string) => void;
};

/** One language server process serving one browser connection. */
export class Session {
    readonly id = crypto.randomUUID();
    /** Everything for this session; deleted when it ends. */
    readonly dir: string;
    /** The editor's workspace: where its files are mirrored. */
    private readonly projectDir: string;
    private readonly serverUri: string;
    private readonly process: Subprocess<"pipe", "pipe", "pipe">;
    private readonly reader = new MessageReader();
    /** Keeps client messages in order while files are written to disk. */
    private queue: Promise<void> = Promise.resolve();
    private idleTimer: ReturnType<typeof setTimeout> | undefined;
    private disposed = false;

    constructor(
        readonly serverId: string,
        readonly userId: string,
        private readonly config: Config,
        private readonly callbacks: Callbacks,
    ) {
        this.dir = join(config.workspaceRoot, this.id);
        this.projectDir = join(this.dir, "project");
        mkdirSync(this.projectDir, { recursive: true });
        for (const [path, content] of Object.entries(projectFiles(serverId))) {
            const file = join(this.projectDir, path);
            mkdirSync(dirname(file), { recursive: true });
            writeFileSync(file, content);
        }
        this.serverUri = sessionWorkspaceUri(this.projectDir);

        const command = serverCommand(serverId, {
            session: this.dir,
            project: this.projectDir,
        });
        if (!command) throw new Error(`Unknown language server "${serverId}"`);

        this.process = Bun.spawn(command, {
            cwd: this.projectDir,
            stdin: "pipe",
            stdout: "pipe",
            stderr: "pipe",
            onExit: (_proc, exitCode, signal) => {
                if (this.disposed) return;
                log("server exited", { session: this.id, exitCode, signal });
                this.callbacks.close(
                    CLOSE_SERVER_EXITED,
                    "language server exited",
                );
            },
        });

        void this.pumpStdout();
        void this.pumpStderr();
        this.resetIdleTimer();
        log("session started", { session: this.id, server: serverId, userId });
    }

    /** Handles one JSON message from the browser. */
    fromClient(raw: string): void {
        this.resetIdleTimer();
        this.queue = this.queue
            .then(() => this.forwardToServer(raw))
            .catch((error: unknown) =>
                log("dropped client message", {
                    session: this.id,
                    error: String(error),
                }),
            );
    }

    async dispose(): Promise<void> {
        if (this.disposed) return;
        this.disposed = true;
        clearTimeout(this.idleTimer);

        this.process.kill("SIGTERM");
        const killTimer = setTimeout(
            () => this.process.kill("SIGKILL"),
            KILL_GRACE_MS,
        );
        await this.process.exited;
        clearTimeout(killTimer);

        await rm(this.dir, { recursive: true, force: true });
        log("session ended", { session: this.id });
    }

    private async forwardToServer(raw: string): Promise<void> {
        const message = JSON.parse(raw) as { method?: string };

        const mirror = documentToMirror(message);
        if (mirror)
            await Bun.write(
                join(this.projectDir, mirror.fileName),
                mirror.text,
            );

        const rewritten = rewriteUris(
            message,
            CLIENT_WORKSPACE_URI,
            this.serverUri,
        );
        this.process.stdin.write(encodeMessage(JSON.stringify(rewritten)));
        await this.process.stdin.flush();
    }

    private async pumpStdout(): Promise<void> {
        for await (const chunk of this.process.stdout) {
            for (const body of this.reader.push(chunk)) {
                const message: unknown = JSON.parse(body);
                const rewritten = rewriteUris(
                    message,
                    this.serverUri,
                    CLIENT_WORKSPACE_URI,
                );
                this.callbacks.send(JSON.stringify(rewritten));
            }
        }
    }

    private async pumpStderr(): Promise<void> {
        const decoder = new TextDecoder();
        for await (const chunk of this.process.stderr) {
            const text = decoder.decode(chunk).trim();
            if (text) {
                log("server stderr", {
                    session: this.id,
                    text: text.slice(0, 500),
                });
            }
        }
    }

    private resetIdleTimer(): void {
        clearTimeout(this.idleTimer);
        this.idleTimer = setTimeout(() => {
            log("idle timeout", { session: this.id });
            this.callbacks.close(CLOSE_IDLE, "idle timeout");
        }, this.config.idleTimeoutMs);
    }
}

export function log(event: string, fields: Record<string, unknown> = {}) {
    console.log(
        JSON.stringify({ time: new Date().toISOString(), event, ...fields }),
    );
}
