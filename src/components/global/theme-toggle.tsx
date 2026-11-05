"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "~/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";

const OPTIONS = [
    { value: "light", label: "Light", Icon: SunIcon },
    { value: "dark", label: "Dark", Icon: MoonIcon },
    { value: "system", label: "System", Icon: MonitorIcon },
] as const;

/**
 * The trigger's icon comes from the `dark` class (CSS), not `useTheme`,
 * which is unknown on the server; reading it would mismatch on hydration.
 */
function CurrentThemeIcon() {
    return (
        <>
            <SunIcon className="size-5 dark:hidden" />
            <MoonIcon className="hidden size-5 dark:block" />
        </>
    );
}

/** Navbar menu: Light, Dark, or System. */
export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Color theme">
                    <CurrentThemeIcon />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Theme</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                    {OPTIONS.map(({ value, label, Icon }) => (
                        <DropdownMenuRadioItem key={value} value={value}>
                            <Icon className="size-4" />
                            {label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/**
 * The same choice as a row of buttons, for the mobile menu. It shows the
 * selection from `useTheme`, so it must not be server-rendered; the mobile
 * menu only renders once opened.
 */
export function ThemeToggleGroup() {
    const { theme, setTheme } = useTheme();
    return (
        <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={theme ?? ""}
            // Radix allows deselecting; keep one selected.
            onValueChange={(v) => v && setTheme(v)}
            className="w-full"
            aria-label="Color theme"
        >
            {OPTIONS.map(({ value, label, Icon }) => (
                <ToggleGroupItem key={value} value={value} className="gap-1.5">
                    <Icon className="size-4" />
                    {label}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    );
}
