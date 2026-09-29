"use client";

import { toast } from "sonner";
import { ClassificationForm } from "~/components/school/classification-form";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";

/** Lets a teacher set their school's UIL classification. */
export function SchoolClassificationCard() {
    const utils = api.useUtils();
    const { data: school, isPending } = api.school.getMine.useQuery();
    const save = api.school.setMyClassification.useMutation({
        onSuccess: async () => {
            toast.success("School classification saved");
            await utils.school.getMine.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    School classification
                    {school && (
                        <span className="text-muted-foreground font-normal">
                            {" "}
                            · {school.name}
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-muted-foreground text-sm">
                    Your UIL academic conference, region, and district. Used to
                    filter the leaderboards shared by all schools.
                </p>
                {isPending ? (
                    <Skeleton className="h-9 w-full" />
                ) : school ? (
                    <ClassificationForm
                        initial={school}
                        onSave={(classification) => save.mutate(classification)}
                        isSaving={save.isPending}
                    />
                ) : null}
            </CardContent>
        </Card>
    );
}
