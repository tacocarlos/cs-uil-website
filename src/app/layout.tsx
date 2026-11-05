import "~/styles/globals.css";

import { type Metadata } from "next";
import Navbar from "~/components/global/Navbar";
import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "~/components/ui/sonner";
import { ThemeProvider } from "~/components/global/theme-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
    title: "GHS Computer Science UIL",
    description:
        "Practice problems, contests, and resources for GHS Computer Science UIL.",
    icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        // next-themes sets the `dark` class before React hydrates.
        <html lang="en" suppressHydrationWarning>
            <body>
                <ThemeProvider>
                    <TRPCReactProvider>
                        <Navbar />
                        <main className="min-h-screen">{children}</main>
                    </TRPCReactProvider>
                    <Toaster />
                    <Analytics />
                    <SpeedInsights />
                </ThemeProvider>
            </body>
        </html>
    );
}
