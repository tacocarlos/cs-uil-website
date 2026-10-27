export type CsvCell = string | number | boolean | Date | null | undefined;

/**
 * One CSV cell: quoted when it holds a comma, quote or line break, and
 * empty for null/undefined. Text starting with =, +, -, @ or a tab/return
 * gets a leading apostrophe so spreadsheets don't run it as a formula
 * (student names are typed by students).
 */
function csvCell(value: CsvCell): string {
    if (value === null || value === undefined) return "";
    if (value instanceof Date) return value.toISOString();
    if (typeof value !== "string") return String(value);

    const text = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** Saves a CSV document as a file, from the browser. */
export function downloadCsv(filename: string, csv: string) {
    const url = URL.createObjectURL(
        new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

/** A CSV document (RFC 4180, CRLF line endings) with a header row. */
export function toCsv(header: string[], rows: CsvCell[][]): string {
    return [header, ...rows]
        .map((row) => row.map(csvCell).join(","))
        .join("\r\n")
        .concat("\r\n");
}
