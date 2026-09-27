/**
 * Minimal stand-in for a real language server, used by gateway.test.ts.
 * Answers `initialize` and `shutdown`, and reacts to `didOpen` by publishing
 * one diagnostic that reports the URI it saw and whether that file exists on
 * disk (i.e. whether the gateway mirrored it).
 */
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { encodeMessage, MessageReader } from "../src/framing";

type Message = {
    id?: number;
    method?: string;
    params?: { rootUri?: string; textDocument?: { uri: string } };
};

function send(message: object) {
    process.stdout.write(encodeMessage(JSON.stringify(message)));
}

const reader = new MessageReader();
for await (const chunk of Bun.stdin.stream()) {
    for (const body of reader.push(chunk)) {
        const message = JSON.parse(body) as Message;
        switch (message.method) {
            case "initialize":
                send({
                    jsonrpc: "2.0",
                    id: message.id,
                    result: {
                        capabilities: { textDocumentSync: 1 },
                        serverInfo: { name: "fake", version: "0" },
                        // A flag, not the URI itself: the gateway would
                        // rewrite an echoed URI back to the placeholder.
                        sawPlaceholderRoot:
                            message.params?.rootUri === "file:///workspace",
                    },
                });
                break;
            case "textDocument/didOpen": {
                const uri = message.params!.textDocument!.uri;
                send({
                    jsonrpc: "2.0",
                    method: "textDocument/publishDiagnostics",
                    params: {
                        uri,
                        diagnostics: [
                            {
                                range: {
                                    start: { line: 0, character: 0 },
                                    end: { line: 0, character: 1 },
                                },
                                message: `onDisk=${existsSync(fileURLToPath(uri))}`,
                            },
                        ],
                    },
                });
                break;
            }
            case "shutdown":
                send({ jsonrpc: "2.0", id: message.id, result: null });
                break;
            case "exit":
                process.exit(0);
        }
    }
}
