import { describe, expect, test } from "bun:test";
import {
    CLIENT_WORKSPACE_URI,
    documentToMirror,
    formattingOptions,
    rewriteUris,
} from "./workspace";

describe("formattingOptions", () => {
    const request = (options: unknown, method = "textDocument/formatting") => ({
        method,
        params: { textDocument: { uri: "file:///workspace/main.c" }, options },
    });

    test("reads the indentation from formatting requests", () => {
        expect(
            formattingOptions(request({ tabSize: 4, insertSpaces: true })),
        ).toEqual({ tabSize: 4, insertSpaces: true });
        expect(
            formattingOptions(
                request(
                    {
                        tabSize: 2,
                        insertSpaces: false,
                        trimFinalNewlines: true,
                    },
                    "textDocument/rangeFormatting",
                ),
            ),
        ).toEqual({ tabSize: 2, insertSpaces: false });
    });

    test("ignores other messages", () => {
        expect(
            formattingOptions(
                request(
                    { tabSize: 4, insertSpaces: true },
                    "textDocument/hover",
                ),
            ),
        ).toBeUndefined();
    });

    // The values are written into a config file.
    test("rejects anything but a small integer and a boolean", () => {
        for (const options of [
            undefined,
            { tabSize: "4\nIndentWidth: 99", insertSpaces: true },
            { tabSize: 4.5, insertSpaces: true },
            { tabSize: 0, insertSpaces: true },
            { tabSize: 17, insertSpaces: true },
            { tabSize: 4, insertSpaces: "yes" },
        ]) {
            expect(formattingOptions(request(options))).toBeUndefined();
        }
    });
});

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
    const allowed = ["Main.java"];

    test("mirrors didOpen", () => {
        expect(
            documentToMirror(
                {
                    method: "textDocument/didOpen",
                    params: { textDocument: { uri, text: "class Main {}" } },
                },
                allowed,
            ),
        ).toEqual({ fileName: "Main.java", text: "class Main {}" });
    });

    test("mirrors full-text didChange", () => {
        expect(
            documentToMirror(
                {
                    method: "textDocument/didChange",
                    params: {
                        textDocument: { uri },
                        contentChanges: [{ text: "v2" }],
                    },
                },
                allowed,
            ),
        ).toEqual({ fileName: "Main.java", text: "v2" });
    });

    test("ignores incremental didChange", () => {
        expect(
            documentToMirror(
                {
                    method: "textDocument/didChange",
                    params: {
                        textDocument: { uri },
                        contentChanges: [{ text: "x", range: {} }],
                    },
                },
                allowed,
            ),
        ).toBeUndefined();
    });

    test("ignores other messages", () => {
        expect(
            documentToMirror(
                {
                    method: "textDocument/hover",
                    params: { textDocument: { uri } },
                },
                allowed,
            ),
        ).toBeUndefined();
    });

    test.each([
        "file:///etc/passwd",
        `${CLIENT_WORKSPACE_URI}/../etc/passwd`,
        `${CLIENT_WORKSPACE_URI}/sub/Main.java`,
        `${CLIENT_WORKSPACE_URI}/..%2Fetc%2Fpasswd`,
        `${CLIENT_WORKSPACE_URI}/.bashrc`,
        `${CLIENT_WORKSPACE_URI}/`,
        `${CLIENT_WORKSPACE_URI}/build.gradle`,
        `${CLIENT_WORKSPACE_URI}/pom.xml`,
        `${CLIENT_WORKSPACE_URI}/compile_commands.json`,
        `${CLIENT_WORKSPACE_URI}/main.py`,
        `${CLIENT_WORKSPACE_URI}/Main%2Ejava`,
    ])("refuses to write %s", (badUri) => {
        expect(
            documentToMirror(
                {
                    method: "textDocument/didOpen",
                    params: { textDocument: { uri: badUri, text: "x" } },
                },
                allowed,
            ),
        ).toBeUndefined();
    });
});
