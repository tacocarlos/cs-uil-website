"use client";

import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { api } from "~/trpc/react";

export default function SettingsSection({
    userId,
    leaderboardVisibility,
}: {
    userId: string;
    leaderboardVisibility: boolean;
}) {
    const utils = api.useUtils();
    const lvMutation = api.user.toggleLeaderboardVisibility.useMutation({
        onSuccess: (newUser) => {
            console.log("updated user settings");
            utils.user.invalidate();
        },
    });

    return (
        <div>
            <span className="flex space-x-3">
                <Label htmlFor="lv-switch">Show Scores in Leaderboard</Label>
                <Switch
                    id="lv-switch"
                    checked={leaderboardVisibility}
                    onClick={async () => {
                        lvMutation.mutate({
                            userId,
                            currentVisibility: leaderboardVisibility,
                        });
                    }}
                />
            </span>
        </div>
    );
}
