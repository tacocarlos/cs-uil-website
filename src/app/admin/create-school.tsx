"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";

/**
 * Creates a school by name. Its classification can then be set in the
 * list below, and its teachers added there.
 */
export function CreateSchool() {
    const utils = api.useUtils();
    const [name, setName] = useState("");
    const create = api.school.create.useMutation({
        onSuccess: async (school) => {
            toast.success(`Created ${school.name}`);
            setName("");
            await utils.school.search.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>New school</CardTitle>
            </CardHeader>
            <CardContent>
                <form
                    className="flex max-w-lg gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        create.mutate({
                            name,
                            conference: null,
                            region: null,
                            district: null,
                        });
                    }}
                >
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="School name, e.g. Groveton High School"
                        aria-label="School name"
                        maxLength={100}
                    />
                    <Button
                        type="submit"
                        disabled={create.isPending || name.trim().length < 2}
                    >
                        {create.isPending ? "Creating…" : "Create"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
