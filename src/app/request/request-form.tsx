"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
    CATEGORY_LABELS,
    type FeatureRequestCategory,
} from "~/components/feature-request/labels";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

const MAX_MESSAGE_LENGTH = 2000;

export function RequestForm() {
    const utils = api.useUtils();
    const [category, setCategory] = useState<FeatureRequestCategory>();
    const [message, setMessage] = useState("");

    const submit = api.featureRequest.submit.useMutation({
        onSuccess: async () => {
            toast.success("Thanks! Your request was submitted.");
            setCategory(undefined);
            setMessage("");
            await utils.featureRequest.getMine.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>New request</CardTitle>
            </CardHeader>
            <CardContent>
                <form
                    className="space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!category) return;
                        submit.mutate({ category, message });
                    }}
                >
                    <div className="space-y-2">
                        <Label htmlFor="request-category">Category</Label>
                        <Select
                            // "" shows the placeholder again after a reset.
                            value={category ?? ""}
                            onValueChange={(value) =>
                                setCategory(value as FeatureRequestCategory)
                            }
                        >
                            <SelectTrigger
                                id="request-category"
                                className="w-56"
                            >
                                <SelectValue placeholder="Choose a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(CATEGORY_LABELS).map(
                                    ([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ),
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="request-message">Details</Label>
                        <Textarea
                            id="request-message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="What would you like to see, or what went wrong?"
                            rows={6}
                            maxLength={MAX_MESSAGE_LENGTH}
                        />
                        <p className="text-muted-foreground text-right text-xs">
                            {message.length}/{MAX_MESSAGE_LENGTH}
                        </p>
                    </div>
                    <Button
                        type="submit"
                        disabled={
                            submit.isPending ||
                            !category ||
                            message.trim() === ""
                        }
                    >
                        {submit.isPending ? "Submitting…" : "Submit"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
