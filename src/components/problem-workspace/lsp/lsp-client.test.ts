/**
 * Integration: the editor's real LSP client against the real gateway
 * (lsp-gateway/), with a fake language server, using a token signed by the
 * website's own signer. Covers the happy path and the failure path the
 * editor relies on to fall back to syntax highlighting.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Subprocess } from "bun";
import { lspTargetFor } from "~/lib/lsp/servers";
import { signLspToken } from "~/lib/lsp/token";
import type { LspDiagnostic } from "./protocol";
import { CLOSE_IDLE, connectLsp } from "./lsp-client";

/** Awaits a promise that should reject and returns what it rejected with. */
async function rejection(promise: Promise<unknown>): Promise<Error> {
    try {
        await promise;
    } catch (error) {
        return error as Error;
    }
    throw new Error("expected the promise to reject");
}

const SECRET = "t".repeat(32);
const PORT = 32_000 + Math.floor(Math.random() * 1000);
const GATEWAY_DIR = join(
    import.meta.dir,
    "..",
    "..",
    "..",
    "..",
    "lsp-gateway",
);
const workspaceRoot = mkdtempSync(join(tmpdir(), "lsp-client-test-"));
const python = lspTargetFor("Python")!;

let gateway: Subprocess;

beforeAll(async () => {
    const fakeServer = join(GATEWAY_DIR, "test", "fake-language-server.ts");
    gateway = Bun.spawn(
        [process.execPath, join(GATEWAY_DIR, "src", "index.ts")],
        {
            env: {
                ...process.env,
                PORT: String(PORT),
                LSP_GATEWAY_SECRET: SECRET,
                WORKSPACE_ROOT: workspaceRoot,
                LSP_COMMAND_PYTHON: `${process.execPath} ${fakeServer}`,
            },
            stdout: "ignore",
            stderr: "inherit",
        },
    );
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
        try {
            if ((await fetch(`http://localhost:${PORT}/health`)).ok) return;
        } catch {
            // not up yet
        }
        await Bun.sleep(20);
    }
    throw new Error("gateway did not start");
});

afterAll(async () => {
    gateway.kill();
    await gateway.exited;
    rmSync(workspaceRoot, { recursive: true, force: true });
});

describe("connectLsp", () => {
    test("handshakes and receives diagnostics for the open document", async () => {
        const client = await connectLsp({
            url: `ws://localhost:${PORT}/lsp/python`,
            token: signLspToken({ sub: "u1", srv: "python" }, SECRET),
            target: python,
            onUnexpectedClose: () => undefined,
        });

        const diagnostics = new Promise<LspDiagnostic[]>((resolve) => {
            client.onDiagnostics = resolve;
        });
        client.open("print('hi')\n");
        expect(await diagnostics).toMatchObject([{ message: "onDisk=true" }]);

        await client.dispose();
    });

    test("rejects (rather than hanging) when the token is refused", async () => {
        expect(
            await rejection(
                connectLsp({
                    url: `ws://localhost:${PORT}/lsp/python`,
                    token: signLspToken(
                        { sub: "u1", srv: "python" },
                        "w".repeat(32),
                    ),
                    target: python,
                    onUnexpectedClose: () => undefined,
                }),
            ),
        ).toBeInstanceOf(Error);
    });

    test("rejects when the gateway is unreachable", async () => {
        expect(
            await rejection(
                connectLsp({
                    url: "ws://localhost:1/lsp/python",
                    token: "x",
                    target: python,
                    onUnexpectedClose: () => undefined,
                }),
            ),
        ).toBeInstanceOf(Error);
    });

    test("reports a drop after connecting", async () => {
        const closed = Promise.withResolvers<number>();
        const client = await connectLsp({
            url: `ws://localhost:${PORT}/lsp/python`,
            token: signLspToken({ sub: "u2", srv: "python" }, SECRET),
            target: python,
            onUnexpectedClose: closed.resolve,
        });
        // Simulate the language server dying: exit it via the protocol
        // without going through dispose().
        (
            client as unknown as {
                connection: { notify: (m: string, p: null) => void };
            }
        ).connection.notify("exit", null);
        expect(await closed.promise).toBe(4001);
    });

    test("simulated idle reports 4000, frees the session, and reconnects", async () => {
        const connect = (onUnexpectedClose: (code: number) => void) =>
            connectLsp({
                url: `ws://localhost:${PORT}/lsp/python`,
                token: signLspToken({ sub: "idle-sim", srv: "python" }, SECRET),
                target: python,
                onUnexpectedClose,
            });
        const health = async () =>
            (
                (await (
                    await fetch(`http://localhost:${PORT}/health`)
                ).json()) as {
                    sessions: number;
                }
            ).sessions;

        const closed = Promise.withResolvers<number>();
        const first = await connect(closed.resolve);
        first.simulateIdleClose();
        expect(await closed.promise).toBe(CLOSE_IDLE);

        // The gateway ends the session, as after a real idle timeout.
        const deadline = Date.now() + 5000;
        while ((await health()) > 0 && Date.now() < deadline)
            await Bun.sleep(20);
        expect(await health()).toBe(0);

        // Resuming is just a fresh connection.
        const second = await connect(() => undefined);
        const diagnostics = new Promise<unknown>((resolve) => {
            second.onDiagnostics = resolve;
        });
        second.open("print(2)\n");
        expect(await diagnostics).toMatchObject([{ message: "onDisk=true" }]);
        await second.dispose();
    });
});
