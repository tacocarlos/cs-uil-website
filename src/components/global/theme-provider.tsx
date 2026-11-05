"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Light/dark mode: follows the system until the user picks one (see
 * ThemeToggle), and remembers the pick. Sets the `dark` class on <html>,
 * which switches the theme's colors (globals.css).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {children}
        </NextThemesProvider>
    );
}
