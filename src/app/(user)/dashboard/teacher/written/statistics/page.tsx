import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { WrittenStatistics } from "./written-statistics";

/** Written test statistics for the teacher's school (teachers only). */
export default function WrittenStatisticsPage() {
    return (
        <div className="min-h-screen bg-gray-50 px-8 pt-24 pb-8">
            <div className="mx-auto max-w-3xl">
                <Link
                    href="/dashboard/teacher"
                    className="text-muted-foreground flex items-center gap-1 text-sm hover:underline"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to dashboard
                </Link>
                <h1 className="mt-4 mb-6 text-2xl font-bold">
                    Written test statistics
                </h1>
                <WrittenStatistics />
            </div>
        </div>
    );
}
