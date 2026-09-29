"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";

/** Rows per page: 10 by default, expandable to 50 in steps of 10. */
export const PAGE_SIZES = [10, 20, 30, 40, 50] as const;

/**
 * Splits `items` into pages. The page is clamped when `items` shrinks
 * (e.g. while searching), so it never points past the end.
 */
export function usePagination<T>(items: T[]) {
    const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
    const [requestedPage, setPage] = useState(0);

    const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
    const page = Math.min(requestedPage, pageCount - 1);
    const start = page * pageSize;

    return {
        pageItems: items.slice(start, start + pageSize),
        page,
        pageCount,
        pageSize,
        start,
        total: items.length,
        setPage,
        setPageSize: (size: number) => {
            // Keep the first visible row on screen.
            setPage(Math.floor(start / size));
            setPageSize(size);
        },
    };
}

export function LeaderboardPagination({
    pagination,
}: {
    pagination: ReturnType<typeof usePagination<unknown>>;
}) {
    const { page, pageCount, pageSize, start, total, setPage, setPageSize } =
        pagination;
    if (total === 0) return null;

    return (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Show</span>
                <Select
                    value={pageSize.toString()}
                    onValueChange={(v) => setPageSize(Number(v))}
                >
                    <SelectTrigger
                        className="h-8 w-18"
                        aria-label="Rows per page"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {PAGE_SIZES.map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                                {size}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                    {start + 1}–{Math.min(start + pageSize, total)} of {total}
                </span>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Previous page"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Next page"
                    disabled={page >= pageCount - 1}
                    onClick={() => setPage(page + 1)}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
