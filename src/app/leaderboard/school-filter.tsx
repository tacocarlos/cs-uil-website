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
    CONFERENCES,
    MAX_DISTRICT,
    REGIONS,
    districtLabel,
    regionLabel,
    type SchoolFilter,
} from "~/lib/schools";

const ANY = "any";

/**
 * Conference / region / district pickers for the "All schools" leaderboards.
 * They edit the URL (?conference=2A&region=3&district=23); the page reads
 * it back with parseSchoolFilter.
 */
export function SchoolFilterControls({ filter }: { filter: SchoolFilter }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    function update(changes: Record<string, string | undefined>) {
        const params = new URLSearchParams(searchParams);
        for (const [key, value] of Object.entries(changes)) {
            if (value === undefined || value === ANY) params.delete(key);
            else params.set(key, value);
        }
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }

    const { conference } = filter;

    return (
        <div className="mb-4 flex flex-wrap justify-center gap-2">
            <Select
                value={conference ?? ANY}
                // Region and district numbers depend on the conference.
                onValueChange={(value) =>
                    update({
                        conference: value,
                        region: undefined,
                        district: undefined,
                    })
                }
            >
                <SelectTrigger className="w-40 bg-white">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ANY}>All conferences</SelectItem>
                    {CONFERENCES.map((c) => (
                        <SelectItem key={c} value={c}>
                            {c}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                disabled={!conference}
                value={filter.region?.toString() ?? ANY}
                onValueChange={(value) => update({ region: value })}
            >
                <SelectTrigger className="w-40 bg-white">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ANY}>All regions</SelectItem>
                    {conference &&
                        REGIONS.map((r) => (
                            <SelectItem key={r} value={r.toString()}>
                                {regionLabel(r, conference)}
                            </SelectItem>
                        ))}
                </SelectContent>
            </Select>

            <Select
                disabled={!conference}
                value={filter.district?.toString() ?? ANY}
                onValueChange={(value) => update({ district: value })}
            >
                <SelectTrigger className="w-44 bg-white">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ANY}>All districts</SelectItem>
                    {conference &&
                        Array.from(
                            { length: MAX_DISTRICT },
                            (_, i) => i + 1,
                        ).map((d) => (
                            <SelectItem key={d} value={d.toString()}>
                                {districtLabel(d, conference)}
                            </SelectItem>
                        ))}
                </SelectContent>
            </Select>
        </div>
    );
}
