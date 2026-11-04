import { describe, expect, test } from "bun:test";
import { clangFormatStyle, formattingFiles } from "./servers";

describe("formattingFiles", () => {
    test("gives clangd a .clang-format matching the editor", () => {
        expect(
            formattingFiles("clangd", { tabSize: 4, insertSpaces: true }),
        ).toEqual({
            ".clang-format": clangFormatStyle({
                tabSize: 4,
                insertSpaces: true,
            }),
        });
    });

    test("writes nothing for servers that read the request's options", () => {
        expect(
            formattingFiles("java", { tabSize: 4, insertSpaces: true }),
        ).toEqual({});
    });
});

describe("clangFormatStyle", () => {
    test("spaces", () => {
        const style = clangFormatStyle({ tabSize: 4, insertSpaces: true });
        expect(style).toContain("IndentWidth: 4\n");
        expect(style).toContain("UseTab: Never\n");
        expect(style).toContain("AccessModifierOffset: -4\n");
    });

    test("tabs indent with tabs only", () => {
        const style = clangFormatStyle({ tabSize: 8, insertSpaces: false });
        expect(style).toContain("TabWidth: 8\n");
        expect(style).toContain("UseTab: ForIndentation\n");
    });
});
