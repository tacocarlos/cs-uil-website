import { describe, expect, test } from "vitest";
import { columnsToCsv, toCsv } from "./csv";

describe("toCsv", () => {
    test("writes a header and rows with CRLF line endings", () => {
        expect(
            toCsv(
                ["Name", "Score"],
                [
                    ["Ada", 90],
                    ["Grace", 85],
                ],
            ),
        ).toBe("Name,Score\r\nAda,90\r\nGrace,85\r\n");
    });

    test("quotes cells with commas, quotes and line breaks", () => {
        expect(toCsv(["a", "b", "c"], [["x, y", 'say "hi"', "1\n2"]])).toBe(
            'a,b,c\r\n"x, y","say ""hi""","1\n2"\r\n',
        );
    });

    test("writes empty, boolean, number and date cells", () => {
        const date = new Date("2026-10-27T15:00:00.000Z");
        expect(toCsv(["a"], [[null], [undefined], [true], [-5], [date]])).toBe(
            "a\r\n\r\n\r\ntrue\r\n-5\r\n2026-10-27T15:00:00.000Z\r\n",
        );
    });

    test("defuses text that spreadsheets would run as a formula", () => {
        expect(toCsv(["a"], [["=SUM(A1)"], ["+1"], ["-x"], ["@a"]])).toBe(
            "a\r\n'=SUM(A1)\r\n'+1\r\n'-x\r\n'@a\r\n",
        );
        expect(toCsv(["a"], [['=HYPERLINK("x","y")']])).toBe(
            'a\r\n"\'=HYPERLINK(""x"",""y"")"\r\n',
        );
    });
});

describe("columnsToCsv", () => {
    test("writes each column's header and its value per row", () => {
        const rows = [
            { name: "Ada", score: 90 },
            { name: "Alan", score: 85 },
        ];
        expect(
            columnsToCsv(
                [
                    { header: "Student", value: (r) => r.name },
                    { header: "Score", value: (r) => r.score },
                ],
                rows,
            ),
        ).toBe("Student,Score\r\nAda,90\r\nAlan,85\r\n");
    });
});
