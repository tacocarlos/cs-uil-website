/**
 * End-to-end: runs the real gateway with a fake language server
 * (test/fake-language-server.ts) and talks to it over a real WebSocket.
 */
import { createHmac } from "node:crypto";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Subprocess } from "bun";

const SECRET = "s".repeat(32);
const PORT = 31_000 + Math.floor(Math.random() * 1000);
const BASE = `ws://localhost:${PORT}/lsp/python`;
const workspaceRoot = mkdtempSync(join(tmpdir(), "lsp-gateway-test-"));

let gateway: Subprocess;

function token(
    claims: Partial<{ sub: string; srv: string; exp: number }> = {},
) {
    const payload = {
        sub: "user-1",
        srv: "python",
        exp: Math.floor(Date.now() / 1000) + 60,
        ...claims,
    };
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const sig = createHmac("sha256", SECRET).update(body).digest("base64url");
    return `${body}.${sig}`;
}

/** Opens a socket and collects every message it receives. */
function connect(tok: string) {
    const ws = new WebSocket(`${BASE}?token=${encodeURIComponent(tok)}`);
    const received: {
        id?: number;
        method?: string;
        result?: unknown;
        params?: unknown;
    }[] = [];
    ws.onmessage = (e) => received.push(JSON.parse(String(e.data)));
    const opened = new Promise<void>((resolve, reject) => {
        ws.onopen = () => resolve();
        ws.onerror = () => reject(new Error("socket error"));
    });
    const closed = new Promise<number>((resolve) => {
        ws.onclose = (e) => resolve(e.code);
    });
    return { ws, received, opened, closed };
}

async function waitFor<T>(
    find: () => T | undefined | Promise<T | undefined>,
    ms = 5000,
): Promise<T> {
    const deadline = Date.now() + ms;
    while (Date.now() < deadline) {
        const found = await find();
        if (found !== undefined) return found;
        await Bun.sleep(20);
    }
    throw new Error("timed out waiting for message");
}

beforeAll(async () => {
    const fakeServer = join(
        import.meta.dir,
        "..",
        "test",
        "fake-language-server.ts",
    );
    gateway = Bun.spawn([process.execPath, join(import.meta.dir, "index.ts")], {
        env: {
            ...process.env,
            PORT: String(PORT),
            LSP_GATEWAY_SECRET: SECRET,
            WORKSPACE_ROOT: workspaceRoot,
            MAX_SESSIONS_PER_USER: "1",
            LSP_COMMAND_PYTHON: `${process.execPath} ${fakeServer}`,
        },
        stdout: "ignore",
        stderr: "inherit",
    });
    await waitFor(async () => {
        try {
            const res = await fetch(`http://localhost:${PORT}/health`);
            return res.ok ? true : undefined;
        } catch {
            return undefined;
        }
    });
});

afterAll(async () => {
    gateway.kill();
    await gateway.exited;
    rmSync(workspaceRoot, { recursive: true, force: true });
});

describe("gateway", () => {
    test("rejects connections without a valid token", async () => {
        for (const bad of [
            "",
            "nope",
            token({ srv: "java" }),
            token({ exp: 0 }),
        ]) {
            const res = await fetch(
                `http://localhost:${PORT}/lsp/python?token=${encodeURIComponent(bad)}`,
                { headers: { Upgrade: "websocket", Connection: "Upgrade" } },
            );
            expect(res.status).toBe(401);
        }
    });

    test("404s unknown servers", async () => {
        const res = await fetch(`http://localhost:${PORT}/lsp/cobol`);
        expect(res.status).toBe(404);
    });

    test("relays LSP, rewrites URIs, mirrors files, and cleans up", async () => {
        const { ws, received, opened, closed } = connect(token());
        await opened;

        ws.send(
            JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "initialize",
                params: { rootUri: "file:///workspace", capabilities: {} },
            }),
        );
        const init = await waitFor(() => received.find((m) => m.id === 1));
        // The server saw the real session directory, not the placeholder.
        expect(init.result).toMatchObject({ sawPlaceholderRoot: false });

        ws.send(
            JSON.stringify({
                jsonrpc: "2.0",
                method: "textDocument/didOpen",
                params: {
                    textDocument: {
                        uri: "file:///workspace/main.py",
                        languageId: "python",
                        version: 1,
                        text: "print(1)\n",
                    },
                },
            }),
        );
        const diagnostics = await waitFor(() =>
            received.find(
                (m) => m.method === "textDocument/publishDiagnostics",
            ),
        );
        expect(diagnostics.params).toMatchObject({
            // Rewritten back for the browser.
            uri: "file:///workspace/main.py",
            diagnostics: [{ message: "onDisk=true" }],
        });

        // Per-user limit is 1, so a second connection is refused.
        const second = await fetch(
            `http://localhost:${PORT}/lsp/python?token=${encodeURIComponent(token())}`,
            { headers: { Upgrade: "websocket", Connection: "Upgrade" } },
        );
        expect(second.status).toBe(429);

        ws.close(1000);
        await closed;
        // The session's scratch directory is removed once the server exits.
        await waitFor(() =>
            readdirSync(workspaceRoot).length === 0 ? true : undefined,
        );
    });
});
