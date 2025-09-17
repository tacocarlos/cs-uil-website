"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut, useSession } from "auth-client";
import { Button } from "../ui/button";
import { redirect, usePathname } from "next/navigation";
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

function LoginStatus() {
    const { data: session } = useSession();
    const pathname = usePathname();
    if (session === null) {
        return (
            <Button asChild>
                <Link href="/sign-in">Sign In</Link>
            </Button>
        );
    }

    return (
        <span className="space-x-5">
            <span>Signed in as: {session.user.name}</span>
            <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                    signOut();

                    alert(pathname);
                    redirect(pathname);
                }}
            >
                Sign Out
            </Button>
        </span>
    );
}

function DesktopNavbar() {
    const { data: session } = useSession();
    const haveUserImageURL =
        session?.user.image != null || session?.user.image != undefined;
    const user = session?.user;
    const role = user?.role ?? "student";

    return (
        <NavigationMenu className="text-foreground space-x-3" viewport={false}>
            <NavigationMenuList>
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
                                        Account Setttings
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
                        <Link href="/leaderboard">Leaderboard</Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}

function SmallNavbar() {
    const { data: session } = useSession();
    const haveUserImageURL =
        session?.user.image != null || session?.user.image != undefined;

    return (
        <NavigationMenu
            className="text-foreground space-x-3 md:invisible"
            viewport={false}
        >
            <NavigationMenuList className="relative m-auto mr-0 flex flex-col space-y-3 rounded-xl bg-white px-4">
                <NavigationMenuItem>
                    <NavigationMenuTrigger>Account</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <ul className="grid w-[200px] gap-4">
                            <li>
                                <NavigationMenuLink asChild>
                                    <Link href="/dashboard">Dashboard</Link>
                                </NavigationMenuLink>
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
                                        Account Setttings
                                    </Link>
                                </NavigationMenuLink>
                                <NavigationMenuLink asChild>
                                    <Link href="/dashboard">Leaderboard</Link>
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
                    <NavigationMenuLink asChild>
                        <Link href="/leaderboard">Leaderboard</Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const { data: session } = useSession();

    // Handle scroll effect for navbar
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 10) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

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
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center">
                        <span className="text-xl font-bold">
                            CS UIL 2025-2026
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="invisible md:visible">
                        <DesktopNavbar />
                    </div>
                    {/* <div className="hidden items-center space-x-8 md:flex">
                        <LoginStatus />
                        <Link
                            href="/timeline"
                            className="transition-colors hover:text-yellow-400"
                        >
                            Events
                        </Link>
                        <Link
                            href="/resources"
                            className="transition-colors hover:text-yellow-400"
                        >
                            Resources
                        </Link>
                    </div> */}

                    {/* Mobile Menu Button */}
                    <button
                        className="focus:outline-none md:hidden"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <CloseButtonSVG /> : <HamburgerSVG />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <SmallNavbar />
                    // <div
                    //     className={`motion-opacity-in-0 motion-duration-300 motion-translate-y-in-25 motion-blur-in-md mt-4 rounded-lg py-4 md:hidden ${
                    //         isScrolled
                    //             ? "bg-white text-blue-900"
                    //             : "bg-blue-900 text-white"
                    //     }`}
                    // >
                    //     <div className="flex flex-col space-y-3 px-4">
                    //         <Link
                    //             href="/timeline"
                    //             className="py-2 transition-colors hover:text-yellow-400"
                    //             onClick={() => setIsMenuOpen(false)}
                    //         >
                    //             Events
                    //         </Link>
                    //         <Link
                    //             href="/resources"
                    //             className="py-2 transition-colors hover:text-yellow-400"
                    //             onClick={() => setIsMenuOpen(false)}
                    //         >
                    //             Resources
                    //         </Link>
                    //     </div>
                    // </div>
                )}
            </div>
        </nav>
    );
}
