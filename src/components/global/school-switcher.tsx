"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { organization, useListOrganizations, useSession } from "auth-client";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

/**
 * Lists the user's schools so they can pick which one they're acting in.
 * Renders nothing for users in fewer than two schools.
 */
export function SchoolSwitcher({
    labelClassName,
    itemClassName,
    onSwitched,
}: {
    labelClassName?: string;
    itemClassName?: string;
    onSwitched?: () => void;
}) {
    const router = useRouter();
    const utils = api.useUtils();
    const { data: session } = useSession();
    const { data: schools } = useListOrganizations();
    const [switching, setSwitching] = useState<string | null>(null);

    if (!schools || schools.length < 2) return null;
    const activeId = session?.session.activeOrganizationId;

    async function switchTo(organizationId: string) {
        setSwitching(organizationId);
        const { error } = await organization.setActive({ organizationId });
        setSwitching(null);
        if (error) {
            toast.error(error.message ?? "Couldn't switch schools");
            return;
        }
        // School-specific data (dashboards, leaderboards) must reload.
        await utils.invalidate();
        router.refresh();
        onSwitched?.();
    }

    return (
        <div>
            <p className={labelClassName}>School</p>
            {schools.map((school) => (
                <button
                    key={school.id}
                    type="button"
                    disabled={switching !== null}
                    onClick={() => switchTo(school.id)}
                    className={cn(
                        "flex w-full items-center gap-2 text-left",
                        itemClassName,
                    )}
                >
                    <Check
                        className={cn(
                            "h-4 w-4 shrink-0",
                            school.id !== activeId && "invisible",
                        )}
                    />
                    {school.name}
                </button>
            ))}
        </div>
    );
}
