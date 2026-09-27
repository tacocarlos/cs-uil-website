import { describe, expect, test } from "bun:test";
import {
    CLIENT_WORKSPACE_URI,
    documentToMirror,
    rewriteUris,
} from "./workspace";

const SERVER = "file:///tmp/lsp-sessions/abc";

describe("rewriteUris", () => {
    test("rewrites URIs anywhere in a message", () => {
        const message = {
            method: "initialize",
            params: {
                rootUri: CLIENT_WORKSPACE_URI,
                workspaceFolders: [{ uri: CLIENT_WORKSPACE_URI, name: "w" }],
                textDocument: { uri: `${CLIENT_WORKSPACE_URI}/Main.java` },
                id: 3,
                flag: true,
                none: null,
            },
        };
        expect(rewriteUris(message, CLIENT_WORKSPACE_URI, SERVER)).toEqual({
            method: "initialize",
            params: {
                rootUri: SERVER,
                workspaceFolders: [{ uri: SERVER, name: "w" }],
                textDocument: { uri: `${SERVER}/Main.java` },
                id: 3,
                flag: true,
                none: null,
            },
        });
    });

    test("round-trips", () => {
        const message = { uri: `${CLIENT_WORKSPACE_URI}/main.py` };
        const there = rewriteUris(message, CLIENT_WORKSPACE_URI, SERVER);
        expect(rewriteUris(there, SERVER, CLIENT_WORKSPACE_URI)).toEqual(
            message,
        );
    });
});

describe("documentToMirror", () => {
    const uri = `${CLIENT_WORKSPACE_URI}/Main.java`;

    test("mirrors didOpen", () => {
        expect(
            documentToMirror({
                method: "textDocument/didOpen",
                params: { textDocument: { uri, text: "class Main {}" } },
            }),
        ).toEqual({ fileName: "Main.java", text: "class Main {}" });
    });

    test("mirrors full-text didChange", () => {
        expect(
            documentToMirror({
                method: "textDocument/didChange",
                params: {
                    textDocument: { uri },
                    contentChanges: [{ text: "v2" }],
                },
            }),
        ).toEqual({ fileName: "Main.java", text: "v2" });
    });

    test("ignores incremental didChange", () => {
        expect(
            documentToMirror({
                method: "textDocument/didChange",
                params: {
                    textDocument: { uri },
                    contentChanges: [{ text: "x", range: {} }],
                },
            }),
        ).toBeUndefined();
    });

    test("ignores other messages", () => {
        expect(
            documentToMirror({
                method: "textDocument/hover",
                params: { textDocument: { uri } },
            }),
        ).toBeUndefined();
    });

    test.each([
        "file:///etc/passwd",
        `${CLIENT_WORKSPACE_URI}/../etc/passwd`,
        `${CLIENT_WORKSPACE_URI}/sub/Main.java`,
        `${CLIENT_WORKSPACE_URI}/..%2Fetc%2Fpasswd`,
        `${CLIENT_WORKSPACE_URI}/.bashrc`,
        `${CLIENT_WORKSPACE_URI}/`,
    ])("refuses to write %s", (badUri) => {
        expect(
            documentToMirror({
                method: "textDocument/didOpen",
                params: { textDocument: { uri: badUri, text: "x" } },
            }),
        ).toBeUndefined();
    });
});
