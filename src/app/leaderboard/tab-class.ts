import { cn } from "~/lib/utils";

/** Classes for a leaderboard tab link, plus its size (padding, weight). */
export function tabClass(active: boolean, size: string): string {
    return cn(
        "rounded-md text-sm",
        size,
        active ? "bg-white text-black" : "text-white hover:bg-white/20",
    );
}
