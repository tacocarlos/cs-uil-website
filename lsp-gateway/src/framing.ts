/**
 * Language servers speak LSP over stdio with HTTP-style framing:
 *
 *     Content-Length: 52\r\n
 *     \r\n
 *     {"jsonrpc":"2.0",...}
 *
 * The browser side uses one JSON message per WebSocket frame instead, so the
 * gateway converts between the two.
 */

const HEADER_END = Buffer.from("\r\n\r\n");

export function encodeMessage(json: string): Uint8Array {
    const body = Buffer.from(json, "utf8");
    // Content-Length counts bytes, not characters.
    const header = Buffer.from(`Content-Length: ${body.length}\r\n\r\n`);
    return Buffer.concat([header, body]);
}

/** Incrementally splits a byte stream into LSP message bodies. */
export class MessageReader {
    private buffer = Buffer.alloc(0);

    /** Feeds bytes in; returns every message body completed by them. */
    push(chunk: Uint8Array): string[] {
        this.buffer = Buffer.concat([this.buffer, chunk]);
        const messages: string[] = [];

        for (;;) {
            const headerEnd = this.buffer.indexOf(HEADER_END);
            if (headerEnd === -1) break;

            const header = this.buffer.subarray(0, headerEnd).toString("ascii");
            const match = /content-length:\s*(\d+)/i.exec(header);
            if (!match) {
                throw new Error(`LSP header without Content-Length: ${header}`);
            }

            const bodyStart = headerEnd + HEADER_END.length;
            const bodyEnd = bodyStart + Number(match[1]);
            if (this.buffer.length < bodyEnd) break;

            messages.push(
                this.buffer.subarray(bodyStart, bodyEnd).toString("utf8"),
            );
            this.buffer = this.buffer.subarray(bodyEnd);
        }

        return messages;
    }
}
