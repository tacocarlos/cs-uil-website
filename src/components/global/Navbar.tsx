"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut, useSession } from "auth-client";
import { Button } from "../ui/button";
import { usePathname } from "next/navigation";
import { signInUrl } from "~/lib/auth/redirect-utils";
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

// ── Desktop nav ───────────────────────────────────────────────────────────────

function DesktopNavbar() {
    const { data: session } = useSession();
    const haveUserImageURL =
        session?.user.image != null || session?.user.image != undefined;
    const user = session?.user;
    const role = user?.role ?? "student";
    const pathname = usePathname();

    return (
        <NavigationMenu viewport={false} className="text-foreground space-x-3">
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuLink
                        asChild
                        className={navigationMenuTriggerStyle()}
                    >
                        <Link href="/calculator">TI 84 Plus CE Online</Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                    <NavigationMenuTrigger>Account</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <ul className="grid w-[200px] gap-4">
                            <li>
                                {role !== "student" ? (
                                    <>
                                        <NavigationMenuLink asChild>
                                            <Link href="/dashboard/teacher">
                                                Teacher Dashboard
                                            </Link>
                                        </NavigationMenuLink>
                                        <NavigationMenuLink asChild>
                                            <Link href="/dashboard/student">
                                                Student Dashboard
                                            </Link>
                                        </NavigationMenuLink>
                                    </>
                                ) : (
                                    <NavigationMenuLink asChild>
                                        <Link href="/dashboard">Dashboard</Link>
                                    </NavigationMenuLink>
                                )}
                                <NavigationMenuLink asChild>
                                    <Link
                                        href="/dashboard"
                                        className="flex-row items-center gap-2"
                                    >
                                        {haveUserImageURL ? (
                                            <Image
                                                src={session!.user.image!}
                                                width={25}
                                                height={25}
                                                alt="User icon"
                                                className="rounded-xl"
                                            />
                                        ) : (
                                            <CircleUserRound />
                                        )}
                                        Account Settings
                                    </Link>
                                </NavigationMenuLink>
                            </li>
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                    <NavigationMenuLink
                        asChild
                        className={navigationMenuTriggerStyle()}
                    >
                        <Link href="/timeline">Timeline</Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                    <NavigationMenuLink
                        asChild
                        className={navigationMenuTriggerStyle()}
                    >
                        <Link href="/resources">Resources</Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                    <NavigationMenuLink
                        asChild
                        className={navigationMenuTriggerStyle()}
                    >
                        <Link href="/resources/skill-tree">Skill Tree</Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                    <NavigationMenuTrigger>Leaderboard</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <ul className="grid w-[200px] gap-4">
                            <li>
                                <NavigationMenuLink asChild>
                                    <Link href="/leaderboard">Problems</Link>
                                </NavigationMenuLink>
                                <NavigationMenuLink asChild>
                                    <Link href="/leaderboard/written">
                                        Written
                                    </Link>
                                </NavigationMenuLink>
                            </li>
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>

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
    const { data: session } = useSession();
    const user = session?.user;
    const role = user?.role ?? "student";
    const pathname = usePathname();
    const haveUserImageURL =
        session?.user.image != null || session?.user.image != undefined;

    const link =
        "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-100";
    const sectionLabel =
        "px-3 pt-3 pb-1 text-xs font-semibold tracking-wider text-gray-400 uppercase";

    return (
        <div className="mt-2 rounded-xl border bg-white shadow-lg">
            <nav className="flex flex-col p-2">
                {/* Top-level links */}
                <Link href="/calculator" className={link} onClick={onClose}>
                    TI 84 Plus CE Online
                </Link>
                <Link href="/timeline" className={link} onClick={onClose}>
                    Timeline
                </Link>
                <Link href="/resources" className={link} onClick={onClose}>
                    Resources
                </Link>
                <Link
                    href="/resources/skill-tree"
                    className={link}
                    onClick={onClose}
                >
                    Skill Tree
                </Link>

                {/* Leaderboard */}
                <p className={sectionLabel}>Leaderboard</p>
                <Link href="/leaderboard" className={link} onClick={onClose}>
                    Problems
                </Link>
                <Link
                    href="/leaderboard/written"
                    className={link}
                    onClick={onClose}
                >
                    Written
                </Link>

                {/* Account */}
                <p className={sectionLabel}>Account</p>
                {session ? (
                    <>
                        {role !== "student" ? (
                            <>
                                <Link
                                    href="/dashboard/teacher"
                                    className={link}
                                    onClick={onClose}
                                >
                                    Teacher Dashboard
                                </Link>
                                <Link
                                    href="/dashboard/student"
                                    className={link}
                                    onClick={onClose}
                                >
                                    Student Dashboard
                                </Link>
                            </>
                        ) : (
                            <Link
                                href="/dashboard"
                                className={link}
                                onClick={onClose}
                            >
                                Dashboard
                            </Link>
                        )}
                        <Link
                            href="/dashboard"
                            className={link}
                            onClick={onClose}
                        >
                            {haveUserImageURL ? (
                                <Image
                                    src={session.user.image!}
                                    width={20}
                                    height={20}
                                    alt="User icon"
                                    className="rounded-full"
                                />
                            ) : (
                                <CircleUserRound className="h-5 w-5" />
                            )}
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
