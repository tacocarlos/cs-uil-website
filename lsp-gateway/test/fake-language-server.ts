/**
 * Minimal stand-in for a real language server, used by gateway.test.ts.
 * Answers `initialize`, `shutdown`, and `textDocument/formatting` (with
 * edits describing the request and any `.clang-format` beside the document),
 * and reacts to `didOpen` by publishing one diagnostic that reports the URI
 * it saw and whether that file exists on disk (i.e. whether the gateway
 * mirrored it).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { encodeMessage, MessageReader } from "../src/framing";

type Message = {
    id?: number;
    method?: string;
    params?: {
        rootUri?: string;
        textDocument?: { uri: string };
        options?: { tabSize: number; insertSpaces: boolean };
    };
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
                        capabilities: {
                            textDocumentSync: 1,
                            documentFormattingProvider: true,
                        },
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
            case "textDocument/formatting": {
                // One edit that reports the URI and options it was sent.
                const { textDocument, options } = message.params!;
                const start = { line: 0, character: 0 };
                const edits = [
                    {
                        range: { start, end: start },
                        newText: `${textDocument!.uri} tabSize=${options!.tabSize} insertSpaces=${options!.insertSpaces}`,
                    },
                ];
                // Like clangd, which formats by this file: a second edit
                // carrying its contents, if the gateway wrote one.
                const style = join(
                    dirname(fileURLToPath(textDocument!.uri)),
                    ".clang-format",
                );
                if (existsSync(style)) {
                    edits.push({
                        range: { start, end: start },
                        newText: readFileSync(style, "utf8"),
                    });
                }
                send({ jsonrpc: "2.0", id: message.id, result: edits });
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
