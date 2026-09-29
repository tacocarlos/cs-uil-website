"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
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
    type Conference,
} from "~/lib/schools";

export type Classification = {
    conference: Conference | null;
    region: number | null;
    district: number | null;
};

const UNSET = "unset";

/**
 * Conference / region / district pickers for one school, used by teachers
 * (their own school) and site admins (any school).
 */
export function ClassificationForm({
    initial,
    onSave,
    isSaving,
}: {
    initial: Classification;
    onSave: (classification: Classification) => void;
    isSaving: boolean;
}) {
    const [value, setValue] = useState<Classification>(initial);
    const { conference } = value;
    const changed =
        value.conference !== initial.conference ||
        value.region !== initial.region ||
        value.district !== initial.district;

    const toNumber = (v: string) => (v === UNSET ? null : Number(v));

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Select
                value={conference ?? UNSET}
                // Region and district numbers depend on the conference.
                onValueChange={(v) =>
                    setValue({
                        conference: v === UNSET ? null : (v as Conference),
                        region: null,
                        district: null,
                    })
                }
            >
                <SelectTrigger className="w-36">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={UNSET}>No conference</SelectItem>
                    {CONFERENCES.map((c) => (
                        <SelectItem key={c} value={c}>
                            {c}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                disabled={!conference}
                value={value.region?.toString() ?? UNSET}
                onValueChange={(v) =>
                    setValue({ ...value, region: toNumber(v) })
                }
            >
                <SelectTrigger className="w-40">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={UNSET}>No region</SelectItem>
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
                value={value.district?.toString() ?? UNSET}
                onValueChange={(v) =>
                    setValue({ ...value, district: toNumber(v) })
                }
            >
                <SelectTrigger className="w-44">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={UNSET}>No district</SelectItem>
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

            <Button
                size="sm"
                disabled={!changed || isSaving}
                onClick={() => onSave(value)}
            >
                {isSaving ? "Saving…" : "Save"}
            </Button>
        </div>
    );
}
