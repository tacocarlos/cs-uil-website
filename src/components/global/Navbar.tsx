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
    { href: "/calculator", label: "TI 84 Plus CE Online" },
    ACCOUNT_MENU,
    { href: "/resources", label: "Resources" },
    { href: "/resources/past-problem", label: "Programming Problems" },
    { href: "/sandbox", label: "Online Editor" },
    { href: "/leaderboard", label: "Leaderboard" },
];

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

    return (
        <NavigationMenu viewport={false} className="text-foreground space-x-3">
            <NavigationMenuList>
                {NAV_LINKS.map((item) =>
                    item === ACCOUNT_MENU ? (
                        <NavigationMenuItem key={item}>
                            <NavigationMenuTrigger>
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
                                            labelClassName="px-2 pt-2 pb-1 text-xs font-semibold tracking-wider text-gray-400 uppercase"
                                            itemClassName="hover:bg-accent rounded-sm px-2 py-1.5 text-sm disabled:opacity-50"
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
                                className={navigationMenuTriggerStyle()}
                            >
                                <Link href={item.href}>{item.label}</Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    ),
                )}

                {session ? (
                    <NavigationMenuItem>
                        <Button
                            onClick={async () => {
                                await signOut();
                            }}
                            className="bg-primary-foreground text-accent-foreground hover:bg-destructive hover:text-destructive-foreground"
                        >
                            Sign Out
                        </Button>
                    </NavigationMenuItem>
                ) : (
                    <NavigationMenuItem>
                        <NavigationMenuLink
                            asChild
                            className={navigationMenuTriggerStyle()}
                        >
                            <Link href={signInUrl(pathname)}>Sign In</Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                )}
            </NavigationMenuList>
        </NavigationMenu>
    );
}

// ── Mobile menu ───────────────────────────────────────────────────────────────

function MobileMenu({ onClose }: { onClose: () => void }) {
    const { session, links: accountLinks } = useAccount();
    const pathname = usePathname();

    const link =
        "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-100";
    const sectionLabel =
        "px-3 pt-3 pb-1 text-xs font-semibold tracking-wider text-gray-400 uppercase";

    return (
        <div className="mt-2 rounded-xl border bg-white shadow-lg">
            <nav className="flex flex-col p-2">
                {/* Top-level links; the account section comes last */}
                {NAV_LINKS.map(
                    (item) =>
                        item !== ACCOUNT_MENU && (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={link}
                                onClick={onClose}
                            >
                                {item.label}
                            </Link>
                        ),
                )}

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
                            <p className="mb-2 text-sm text-gray-500">
                                Signed in as{" "}
                                <span className="font-medium text-gray-700">
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
            className={`fixed z-50 w-full transition-all duration-300 ${
                isScrolled
                    ? "bg-white py-2 text-blue-900 shadow-md"
                    : "bg-transparent py-4 text-white"
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

                {/* Mobile menu — always solid white regardless of scroll state */}
                {isMenuOpen && (
                    <MobileMenu onClose={() => setIsMenuOpen(false)} />
                )}
            </div>
        </nav>
    );
}
