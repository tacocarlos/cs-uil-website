import { Download } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

/** Downloads of the school's data as CSV (see ./export/[kind]/route.ts). */
export function ExportDataCard() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Export data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-muted-foreground max-w-xs text-sm">
                    Download your students&apos; scores as CSV, for
                    spreadsheets. Former students are included and marked.
                </p>
                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                        <a href="/dashboard/teacher/export/written" download>
                            <Download className="mr-1.5 h-4 w-4" />
                            Written scores
                        </a>
                    </Button>
                    <Button asChild variant="outline">
                        <a
                            href="/dashboard/teacher/export/programming"
                            download
                        >
                            <Download className="mr-1.5 h-4 w-4" />
                            Programming submissions
                        </a>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
