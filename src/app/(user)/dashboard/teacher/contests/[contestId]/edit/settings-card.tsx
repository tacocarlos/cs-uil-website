import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { api, type RouterOutputs } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
    settingsFromContest,
    settingsToMutationInput,
    validateSettings,
} from "../../_components/contest-settings";
import { ContestSettingsFields } from "../../_components/contest-settings-fields";

type Contest = NonNullable<RouterOutputs["contest"]["getById"]>;

export function SettingsCard({ contest }: { contest: Contest }) {
    const utils = api.useUtils();
    const updateContest = api.contest.update.useMutation();

    // Seeded once; later refetches don't overwrite in-progress edits.
    const [settings, setSettings] = useState(() =>
        settingsFromContest(contest),
    );

    const handleSave = async () => {
        const error = validateSettings(settings);
        if (error) {
            toast.error(error);
            return;
        }
        try {
            await updateContest.mutateAsync({
                contestId: contest.id,
                ...settingsToMutationInput(settings),
            });
            toast.success("Settings saved");
            await utils.contest.getById.invalidate({ contestId: contest.id });
        } catch (err) {
            toast.error("Failed to save: " + (err as Error).message);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <ContestSettingsFields
                    value={settings}
                    onChange={setSettings}
                />

                <div className="flex justify-end pt-2">
                    <Button
                        onClick={handleSave}
                        disabled={updateContest.isPending}
                    >
                        {updateContest.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving…
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Settings
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
