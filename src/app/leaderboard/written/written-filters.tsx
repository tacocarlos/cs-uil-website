"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import {
    competitionLabel,
    type WrittenCompetition,
} from "~/lib/written/competitions";
import { currentSeasonYear } from "~/lib/written/season";

const ALL = "all";

/**
 * Season and competition pickers for the written leaderboard. Like the
 * school filter, they edit the URL (?year=2027&competition=district).
 */
export function WrittenFilterControls({
    year,
    competition,
    years,
    competitions,
}: {
    /** The selected season; undefined for all seasons. */
    year: number | undefined;
    competition: WrittenCompetition | undefined;
    /** Seasons with visible scores, newest first. */
    years: number[];
    /** Competitions with visible scores in the selected season. */
    competitions: WrittenCompetition[];
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    function update(changes: Record<string, string | undefined>) {
        const params = new URLSearchParams(searchParams);
        for (const [key, value] of Object.entries(changes)) {
            if (value === undefined) params.delete(key);
            else params.set(key, value);
        }
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }

    // The current season is always offered, even before it has scores.
    const current = currentSeasonYear();
    const seasons = years.includes(current) ? years : [current, ...years];

    return (
        <div className="mb-4 flex flex-wrap justify-center gap-2">
            <Select
                value={year?.toString() ?? ALL}
                // Another season may not have the selected competition.
                onValueChange={(value) =>
                    update({
                        year: value === current.toString() ? undefined : value,
                        competition: undefined,
                    })
                }
            >
                <SelectTrigger className="w-44 bg-white" aria-label="Season">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL}>All seasons</SelectItem>
                    {seasons.map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                            {y === current
                                ? `${y} season (current)`
                                : `${y} season`}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={competition ?? ALL}
                onValueChange={(value) =>
                    update({ competition: value === ALL ? undefined : value })
                }
            >
                <SelectTrigger
                    className="w-44 bg-white"
                    aria-label="Competition"
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL}>All competitions</SelectItem>
                    {competitions.map((c) => (
                        <SelectItem key={c} value={c}>
                            {competitionLabel(c)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
