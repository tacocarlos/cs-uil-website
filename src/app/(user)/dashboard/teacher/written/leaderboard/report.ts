import { downloadCsv, toCsv } from "~/lib/csv";
import { formatAccuracy } from "~/lib/written/leaderboard";

/** The leaderboard as the teacher sees it, for a report. */
export type WrittenReportView = {
    school: string | undefined;
    /** e.g. "2027" or "All seasons". */
    season: string;
    /** e.g. "District" or "All competitions". */
    competition: string;
    includeFormer: boolean;
    searchTerm: string;
    /** Ranked rows, filtered by the search term. */
    rows: {
        rank: number;
        name: string;
        score: number;
        /** Average accuracy over the counted tests, 0–1. */
        accuracy: number;
        former: boolean;
    }[];
};

function filename(view: WrittenReportView, extension: string) {
    const slug = (text: string) => text.toLowerCase().replaceAll(" ", "-");
    return `written-scores-${slug(view.season)}-${slug(view.competition)}.${extension}`;
}

/** The filters behind the view, for the report's heading. */
function filterSummary(view: WrittenReportView): string[] {
    return [
        `Season: ${view.season}`,
        `Competition: ${view.competition}`,
        `Former students: ${view.includeFormer ? "included" : "excluded"}`,
        ...(view.searchTerm ? [`Search: "${view.searchTerm}"`] : []),
    ];
}

/**
 * Downloads the view as CSV, with the season and competition on each row
 * so the file explains itself.
 */
export function downloadWrittenCsv(view: WrittenReportView) {
    const csv = toCsv(
        [
            "Rank",
            "Student",
            "Score",
            "Accuracy",
            "Season",
            "Competition",
            "Former student",
        ],
        view.rows.map((row) => [
            row.rank,
            row.name,
            row.score,
            // A 0–1 ratio, which spreadsheets can format as a percentage.
            Number(row.accuracy.toFixed(4)),
            view.season,
            view.competition,
            row.former,
        ]),
    );
    downloadCsv(filename(view, "csv"), csv);
}

/**
 * Downloads the view as a printable PDF: a heading with the school and
 * filters, summary figures, and the ranked table. jsPDF is loaded on
 * demand, so it's only downloaded when a teacher asks for a report.
 */
export async function downloadWrittenPdf(view: WrittenReportView) {
    const [{ jsPDF }, { autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
    ]);
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const margin = 48;
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = margin;

    doc.setFont("helvetica", "bold").setFontSize(18);
    doc.text("Written Test Scores", margin, y);
    y += 20;
    if (view.school) {
        doc.setFont("helvetica", "normal").setFontSize(12);
        doc.text(view.school, margin, y);
        y += 18;
    }

    doc.setFontSize(10).setTextColor(90);
    for (const line of filterSummary(view)) {
        doc.text(line, margin, y);
        y += 14;
    }
    doc.text(
        `Generated ${new Date().toLocaleString()}`,
        pageWidth - margin,
        margin,
        { align: "right" },
    );

    const scores = view.rows.map((row) => row.score);
    if (scores.length > 0) {
        const mean = (values: number[]) =>
            values.reduce((a, b) => a + b, 0) / values.length;
        y += 6;
        doc.setTextColor(0).setFont("helvetica", "bold");
        doc.text(
            [
                `Students: ${scores.length}`,
                `Average: ${mean(scores).toFixed(1)}`,
                `Highest: ${Math.max(...scores)}`,
                `Average accuracy: ${formatAccuracy(mean(view.rows.map((row) => row.accuracy)))}`,
            ].join("     "),
            margin,
            y,
        );
        y += 10;
    }

    autoTable(doc, {
        startY: y + 8,
        margin: { left: margin, right: margin },
        head: [["Rank", "Student", "Score", "Accuracy"]],
        body:
            view.rows.length > 0
                ? view.rows.map((row) => [
                      row.rank,
                      row.former ? `${row.name} (former)` : row.name,
                      row.score,
                      formatAccuracy(row.accuracy),
                  ])
                : [[{ content: "No scores yet.", colSpan: 4 }]],
        headStyles: { fillColor: [30, 41, 59] },
        columnStyles: {
            0: { cellWidth: 50 },
            2: { cellWidth: 60 },
            3: { cellWidth: 70 },
        },
        // Right-align the numbers, headings included (columnStyles skip
        // them).
        didParseCell: ({ column, cell }) => {
            if (column.index >= 2) cell.styles.halign = "right";
        },
        didDrawPage: () => {
            doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(120);
            doc.text(
                `Page ${doc.getNumberOfPages()}`,
                pageWidth - margin,
                doc.internal.pageSize.getHeight() - 24,
                { align: "right" },
            );
        },
    });

    doc.save(filename(view, "pdf"));
}
