import { describe, expect, test } from "bun:test";
import { encodeMessage, MessageReader } from "./framing";

const decoder = new TextDecoder();

describe("encodeMessage", () => {
    test("counts bytes, not characters", () => {
        const framed = decoder.decode(encodeMessage('{"s":"é"}'));
        expect(framed).toBe('Content-Length: 10\r\n\r\n{"s":"é"}');
    });
});

describe("MessageReader", () => {
    test("reads back what encodeMessage wrote", () => {
        const reader = new MessageReader();
        expect(reader.push(encodeMessage('{"a":1}'))).toEqual(['{"a":1}']);
    });

    test("handles several messages in one chunk", () => {
        const reader = new MessageReader();
        const chunk = Buffer.concat([
            encodeMessage('{"a":1}'),
            encodeMessage('{"b":2}'),
        ]);
        expect(reader.push(chunk)).toEqual(['{"a":1}', '{"b":2}']);
    });

    test("waits for messages split across chunks", () => {
        const reader = new MessageReader();
        const framed = encodeMessage('{"text":"héllo wörld"}');
        // Split mid-header and mid-multibyte character.
        const cuts = [5, 21, framed.length - 3];
        let previous = 0;
        const out: string[] = [];
        for (const cut of [...cuts, framed.length]) {
            out.push(...reader.push(framed.subarray(previous, cut)));
            previous = cut;
        }
        expect(out).toEqual(['{"text":"héllo wörld"}']);
    });

    test("tolerates extra headers and any header casing", () => {
        const reader = new MessageReader();
        const raw =
            "content-length: 2\r\nContent-Type: application/vscode-jsonrpc\r\n\r\n{}";
        expect(reader.push(Buffer.from(raw))).toEqual(["{}"]);
    });

    test("rejects a header without a length", () => {
        const reader = new MessageReader();
        expect(() => reader.push(Buffer.from("X: 1\r\n\r\n{}"))).toThrow();
    });
});
