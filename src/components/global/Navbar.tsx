"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut, useActiveMember, useSession } from "auth-client";
import { Button } from "../ui/button";
import { usePathname } from "next/navigation";
import { signInUrl } from "~/lib/auth/redirect-utils";
import { isTeacherRole } from "~/lib/auth/organizations";
import { isSiteAdmin } from "~/lib/auth/roles";
import { SchoolSwitcher } from "./school-switcher";
import { NavigationMenu } from "~/components/ui/navigation-menu";
import {
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "../ui/navigation-menu";
import Image from "next/image";
import { CircleUserRound } from "lucide-react";
import { ThemeToggle, ThemeToggleGroup } from "./theme-toggle";
import { cn } from "~/lib/utils";

// ── Icons ─────────────────────────────────────────────────────────────────────

function HamburgerSVG() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
            />
        </svg>
    );
}

function CloseButtonSVG() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
            />
        </svg>
    );
}

// ── Links ─────────────────────────────────────────────────────────────────────

type NavLink = { href: string; label: string };

/** Where the Account menu goes among the links (desktop only). */
const ACCOUNT_MENU = "account";

/** Top-level links, shared by the desktop and mobile menus. */
const NAV_LINKS: (NavLink | typeof ACCOUNT_MENU)[] = [
    ACCOUNT_MENU,
    { href: "/resources", label: "Resources" },
    { href: "/resources/past-problem", label: "Programming Problems" },
    { href: "/sandbox", label: "Online Editor" },
    { href: "/leaderboard", label: "Leaderboard" },
];

/**
 * The top-level link for the current page: the longest href that the path
 * starts with, so /resources/past-problem/3 marks "Programming Problems"
 * rather than "Resources".
 */
function activeHref(pathname: string): string | undefined {
    return NAV_LINKS.filter((item): item is NavLink => item !== ACCOUNT_MENU)
        .map((item) => item.href)
        .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
        .sort((a, b) => b.length - a.length)[0];
}

/** Paths the Account menu's links lead to. */
const ACCOUNT_PATHS = ["/dashboard", "/admin", "/join"];

/** The signed-in user (if any) and the links in their Account menu. */
function useAccount() {
    const { data: session } = useSession();
    const { data: activeMember } = useActiveMember();

    const links: NavLink[] = isTeacherRole(activeMember?.role)
        ? [
              { href: "/dashboard/teacher", label: "Teacher Dashboard" },
              { href: "/dashboard/student", label: "Student Dashboard" },
          ]
        : [{ href: "/dashboard", label: "Dashboard" }];
    if (isSiteAdmin(session?.user.role)) {
        links.push({ href: "/admin", label: "Site Admin" });
    }
    if (session) links.push({ href: "/join", label: "Join a School" });

    return { session, links };
}

function UserIcon({ image, size }: { image?: string | null; size: number }) {
    return image ? (
        <Image
            src={image}
            width={size}
            height={size}
            alt="User icon"
            className="rounded-full"
        />
    ) : (
        <CircleUserRound style={{ width: size, height: size }} />
    );
}

// ── Desktop nav ───────────────────────────────────────────────────────────────

function DesktopNavbar() {
    const { session, links: accountLinks } = useAccount();
    const pathname = usePathname();
    const active = activeHref(pathname);
    const inAccount = ACCOUNT_PATHS.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
    // Transparent, so links sit on the bar rather than in white pills.
    // Radix sets an empty data-active on the current page's link, which
    // the shadcn data-[active=true] styles don't match.
    const linkClass = navigationMenuTriggerStyle({
        className:
            "data-active:bg-accent data-active:text-accent-foreground bg-transparent",
    });

    return (
        <NavigationMenu viewport={false} className="text-foreground space-x-3">
            <NavigationMenuList>
                {NAV_LINKS.map((item) =>
                    item === ACCOUNT_MENU ? (
                        <NavigationMenuItem key={item}>
                            <NavigationMenuTrigger
                                className={cn(
                                    "bg-transparent",
                                    inAccount &&
                                        "bg-accent text-accent-foreground",
                                )}
                            >
                                Account
                            </NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <ul className="grid w-[200px] gap-4">
                                    <li>
                                        {accountLinks.map(({ href, label }) => (
                                            <NavigationMenuLink
                                                key={href}
                                                asChild
                                            >
                                                <Link href={href}>{label}</Link>
                                            </NavigationMenuLink>
                                        ))}
                                        <SchoolSwitcher
                                            labelClassName="text-muted-foreground px-2 pt-2 pb-1 text-xs font-semibold tracking-wider uppercase"
                                            itemClassName="hover:bg-accent hover:text-accent-foreground rounded-sm px-2 py-1.5 text-sm disabled:opacity-50"
                                        />
                                        <NavigationMenuLink asChild>
                                            <Link
                                                href="/dashboard"
                                                className="flex-row items-center gap-2"
                                            >
                                                <UserIcon
                                                    image={session?.user.image}
                                                    size={25}
                                                />
                                                Account Settings
                                            </Link>
                                        </NavigationMenuLink>
                                    </li>
                                </ul>
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                    ) : (
                        <NavigationMenuItem key={item.href}>
                            <NavigationMenuLink
                                asChild
                                active={item.href === active}
                                className={linkClass}
                            >
                                <Link
                                    href={item.href}
                                    aria-current={
                                        item.href === active
                                            ? "page"
                                            : undefined
                                    }
                                >
                                    {item.label}
                                </Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    ),
                )}

                {session ? (
                    <NavigationMenuItem>
                        <Button
                            variant="outline"
                            onClick={async () => {
                                await signOut();
                            }}
                            className="hover:border-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                            Sign Out
                        </Button>
                    </NavigationMenuItem>
                ) : (
                    <NavigationMenuItem>
                        <NavigationMenuLink asChild className={linkClass}>
                            <Link href={signInUrl(pathname)}>Sign In</Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                )}
                <NavigationMenuItem>
                    <ThemeToggle />
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}

// ── Mobile menu ───────────────────────────────────────────────────────────────

function MobileMenu({ onClose }: { onClose: () => void }) {
    const { session, links: accountLinks } = useAccount();
    const pathname = usePathname();
    const active = activeHref(pathname);

    const link =
        "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground";
    const sectionLabel =
        "px-3 pt-3 pb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase";

    return (
        <div className="bg-popover text-popover-foreground mt-2 max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-xl border shadow-lg">
            <nav className="flex flex-col p-2">
                {/* Top-level links; the account section comes last */}
                {NAV_LINKS.map(
                    (item) =>
                        item !== ACCOUNT_MENU && (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    link,
                                    item.href === active &&
                                        "bg-accent text-accent-foreground",
                                )}
                                aria-current={
                                    item.href === active ? "page" : undefined
                                }
                                onClick={onClose}
                            >
                                {item.label}
                            </Link>
                        ),
                )}

                {/* Theme */}
                <p className={sectionLabel}>Theme</p>
                <div className="px-3 pb-1">
                    <ThemeToggleGroup />
                </div>

                {/* Account */}
                <p className={sectionLabel}>Account</p>
                {session ? (
                    <>
                        {accountLinks.map(({ href, label }) => (
                            <Link
                                key={href}
                                href={href}
                                className={link}
                                onClick={onClose}
                            >
                                {label}
                            </Link>
                        ))}
                        <SchoolSwitcher
                            labelClassName={sectionLabel}
                            itemClassName={link}
                            onSwitched={onClose}
                        />
                        <Link
                            href="/dashboard"
                            className={link}
                            onClick={onClose}
                        >
                            <UserIcon image={session.user.image} size={20} />
                            Account Settings
                        </Link>

                        <div className="mt-2 border-t px-3 pt-3 pb-1">
                            <p className="text-muted-foreground mb-2 text-sm">
                                Signed in as{" "}
                                <span className="text-foreground font-medium">
                                    {session.user.name}
                                </span>
                            </p>
                            <Button
                                size="sm"
                                variant="destructive"
                                className="w-full"
                                onClick={() => {
                                    void signOut();
                                    onClose();
                                }}
                            >
                                Sign Out
                            </Button>
                        </div>
                    </>
                ) : (
                    <Link
                        href={signInUrl(pathname)}
                        className={link}
                        onClick={onClose}
                    >
                        Sign In
                    </Link>
                )}
            </nav>
        </div>
    );
}

// ── Root navbar ───────────────────────────────────────────────────────────────

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={`bg-background/95 text-foreground fixed z-50 w-full border-b backdrop-blur transition-all duration-300 ${
                isScrolled ? "py-2 shadow-md" : "py-4"
            }`}
        >
            <div className="container mx-auto px-4">
                {/* Top bar */}
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center">
                        <span className="text-xl font-bold">
                            CS UIL 2025-2026
                        </span>
                    </Link>

                    {/* Desktop nav — hidden below md, no layout space reserved */}
                    <div className="hidden md:block">
                        <DesktopNavbar />
                    </div>

                    {/* Hamburger — visible only below md */}
                    <button
                        className="focus:outline-none md:hidden"
                        onClick={() => setIsMenuOpen((o) => !o)}
                        aria-label="Toggle menu"
                        aria-expanded={isMenuOpen}
                    >
                        {isMenuOpen ? <CloseButtonSVG /> : <HamburgerSVG />}
                    </button>
                </div>

                {/* Mobile menu — a solid panel regardless of scroll state */}
                {isMenuOpen && (
                    <MobileMenu onClose={() => setIsMenuOpen(false)} />
                )}
            </div>
        </nav>
    );
}
