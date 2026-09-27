import { describe, expect, test } from "bun:test";
import { JsonRpcConnection, type SocketLike } from "./json-rpc";

/** Awaits a promise that should reject and returns what it rejected with. */
async function rejection(promise: Promise<unknown>): Promise<Error> {
    try {
        await promise;
    } catch (error) {
        return error as Error;
    }
    throw new Error("expected the promise to reject");
}

/** In-memory socket: records what's sent and lets the test push replies. */
function fakeSocket() {
    const listeners: Record<string, ((event: never) => void)[]> = {};
    const sent: { id?: number; method?: string; result?: unknown }[] = [];
    const socket: SocketLike = {
        send: (data) => sent.push(JSON.parse(data) as (typeof sent)[number]),
        close: (code = 1000) => emit("close", { code, reason: "" }),
        addEventListener: (type: string, listener: (e: never) => void) => {
            (listeners[type] ??= []).push(listener);
        },
    };
    function emit(type: string, event: object) {
        for (const l of listeners[type] ?? []) l(event as never);
    }
    return {
        socket,
        sent,
        receive: (message: object) =>
            emit("message", { data: JSON.stringify(message) }),
    };
}

function connection(
    overrides: Partial<ConstructorParameters<typeof JsonRpcConnection>[1]> = {},
) {
    const fake = fakeSocket();
    const conn = new JsonRpcConnection(fake.socket, {
        onNotification: () => undefined,
        onRequest: () => null,
        onClose: () => undefined,
        ...overrides,
    });
    return { ...fake, conn };
}

describe("JsonRpcConnection", () => {
    test("matches responses to requests", async () => {
        const { conn, sent, receive } = connection();
        const a = conn.request("a", {});
        const b = conn.request("b", {});
        receive({ jsonrpc: "2.0", id: sent[1]!.id, result: "B" });
        receive({ jsonrpc: "2.0", id: sent[0]!.id, result: "A" });
        expect(await a).toBe("A");
        expect(await b).toBe("B");
    });

    test("rejects on error responses", async () => {
        const { conn, sent, receive } = connection();
        const req = conn.request("x", {});
        receive({
            jsonrpc: "2.0",
            id: sent[0]!.id,
            error: { code: -32601, message: "no such method" },
        });
        expect((await rejection(req)).message).toContain("no such method");
    });

    test("times out", async () => {
        const { conn } = connection();
        expect(
            (await rejection(conn.request("slow", {}, 10))).message,
        ).toContain("timed out");
    });

    test("rejects pending requests when the socket closes", async () => {
        const closes: number[] = [];
        const { conn, socket } = connection({
            onClose: (e) => closes.push(e.code),
        });
        const req = conn.request("x", {});
        socket.close(4001);
        expect((await rejection(req)).message).toContain("connection closed");
        expect(closes).toEqual([4001]);
        expect((await rejection(conn.request("y", {}))).message).toContain(
            "connection closed",
        );
    });

    test("delivers notifications", () => {
        const got: [string, unknown][] = [];
        const { receive } = connection({
            onNotification: (method, params) => got.push([method, params]),
        });
        receive({ jsonrpc: "2.0", method: "note", params: { a: 1 } });
        expect(got).toEqual([["note", { a: 1 }]]);
    });

    test("answers server requests, even when the handler throws", () => {
        const { sent, receive } = connection({
            onRequest: (method) => {
                if (method === "boom") throw new Error("x");
                return ["cfg"];
            },
        });
        receive({ jsonrpc: "2.0", id: 7, method: "workspace/configuration" });
        receive({ jsonrpc: "2.0", id: 8, method: "boom" });
        expect(sent).toEqual([
            { jsonrpc: "2.0", id: 7, result: ["cfg"] } as never,
            { jsonrpc: "2.0", id: 8, result: null } as never,
        ]);
    });

    test("ignores garbage", () => {
        const { receive } = connection();
        expect(() => receive("not json" as never)).not.toThrow();
    });
});
