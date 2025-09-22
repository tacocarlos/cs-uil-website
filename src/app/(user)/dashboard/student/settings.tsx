"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import { Switch } from "~/components/ui/switch";
import { api } from "~/trpc/react";

export default function SettingsSection({ userId }: { userId: string }) {
    const { isPending: userDataPending, data: user } =
        api.user.getUser.useQuery({ userId });
    const leaderboardVisibility = user?.showScoresInLeaderboard;
    const utils = api.useUtils();
    const lvMutation = api.user.toggleLeaderboardVisibility.useMutation({
        onSuccess: (newUser) => {
            console.log("updated user settings");
            utils.user.invalidate();
        },
    });

    if (leaderboardVisibility === undefined) return null;

    if (userDataPending && lvMutation.isPending) {
        return <Skeleton className="h-24 w-full bg-gray-200" />;
    }

    return (
        <div>
            <span className="flex space-x-3">
                <Label htmlFor="lv-switch">Show Scores in Leaderboard</Label>
                <Switch
                    disabled={lvMutation.isPending || userDataPending}
                    id="lv-switch"
                    checked={leaderboardVisibility}
                    onClick={async () => {
                        toast("updating");
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
