import { useId } from "react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import {
    SCHOOL_CONTEST_VISIBILITIES,
    VISIBILITY_LABELS,
} from "~/lib/contest/visibility";
import type {
    ContestSettings,
    ContestVisibility,
    ScoringMode,
} from "./contest-settings";
import { SchoolInvitePicker } from "./school-invite-picker";
import { HostPicker } from "./host-picker";

/**
 * Name, description, schedule, scoring, and who-can-join inputs for a
 * contest.
 */
export function ContestSettingsFields({
    value,
    onChange,
}: {
    value: ContestSettings;
    onChange: (value: ContestSettings) => void;
}) {
    const id = useId();
    const set = <K extends keyof ContestSettings>(
        key: K,
        fieldValue: ContestSettings[K],
    ) => onChange({ ...value, [key]: fieldValue });

    return (
        <>
            <div className="space-y-2">
                <Label htmlFor={`${id}-name`}>Name</Label>
                <Input
                    id={`${id}-name`}
                    placeholder="Spring Invitational 2025"
                    value={value.name}
                    onChange={(e) => set("name", e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor={`${id}-description`}>Description</Label>
                <Textarea
                    id={`${id}-description`}
                    placeholder="Optional description shown to participants"
                    rows={3}
                    value={value.description}
                    onChange={(e) => set("description", e.target.value)}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor={`${id}-startsAt`}>Start</Label>
                    <Input
                        id={`${id}-startsAt`}
                        type="datetime-local"
                        value={value.startsAt}
                        onChange={(e) => set("startsAt", e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`${id}-endsAt`}>End</Label>
                    <Input
                        id={`${id}-endsAt`}
                        type="datetime-local"
                        value={value.endsAt}
                        onChange={(e) => set("endsAt", e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor={`${id}-scoringMode`}>Scoring Mode</Label>
                <Select
                    value={value.scoringMode}
                    onValueChange={(v) => set("scoringMode", v as ScoringMode)}
                >
                    <SelectTrigger id={`${id}-scoringMode`}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="simple">Simple</SelectItem>
                        <SelectItem value="penalty">ICPC Penalty</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Site admins choose global vs. a host school; teachers' contests
                are always hosted by their school. */}
            {value.host !== undefined && (
                <div className="space-y-2">
                    <Label>Contest type</Label>
                    <HostPicker
                        value={value.host}
                        onKindChange={(kind) =>
                            onChange(
                                kind === "global"
                                    ? {
                                          ...value,
                                          host: null,
                                          visibility: "open",
                                          invitedSchools: [],
                                      }
                                    : // No host yet: validation asks for one.
                                      {
                                          ...value,
                                          host: null,
                                          visibility: "school",
                                      },
                            )
                        }
                        onChange={(host) =>
                            onChange({
                                ...value,
                                host,
                                visibility:
                                    value.visibility === "open"
                                        ? "school"
                                        : value.visibility,
                                invitedSchools: value.invitedSchools.filter(
                                    (s) => s.id !== host?.id,
                                ),
                            })
                        }
                    />
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor={`${id}-visibility`}>Who can join</Label>
                {value.visibility === "open" ? (
                    <p className="text-muted-foreground text-sm">
                        {VISIBILITY_LABELS.open.description}
                    </p>
                ) : (
                    <>
                        <Select
                            value={value.visibility}
                            onValueChange={(v) =>
                                set("visibility", v as ContestVisibility)
                            }
                        >
                            <SelectTrigger id={`${id}-visibility`}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {SCHOOL_CONTEST_VISIBILITIES.map((v) => (
                                    <SelectItem key={v} value={v}>
                                        {VISIBILITY_LABELS[v].label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-muted-foreground text-sm">
                            {VISIBILITY_LABELS[value.visibility].description}
                        </p>
                    </>
                )}
                {value.visibility === "invite" && (
                    <SchoolInvitePicker
                        value={value.invitedSchools}
                        onChange={(schools) => set("invitedSchools", schools)}
                        excludeId={value.host?.id}
                    />
                )}
            </div>

            {value.scoringMode === "penalty" && (
                <div className="space-y-2">
                    <Label htmlFor={`${id}-penaltyPoints`}>
                        Penalty Points per Wrong Attempt
                    </Label>
                    <Input
                        id={`${id}-penaltyPoints`}
                        type="number"
                        min={0}
                        value={value.penaltyPoints}
                        onChange={(e) =>
                            set("penaltyPoints", parseInt(e.target.value) || 0)
                        }
                        className="w-32"
                    />
                </div>
            )}
        </>
    );
}
