import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-muted/40 text-foreground border-t px-4 py-8">
            <div className="container mx-auto">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    <div>
                        <h3 className="mb-4 text-lg font-bold">
                            CS UIL 2025-2026
                        </h3>
                    </div>
                    <div>
                        <h3 className="mb-4 text-lg font-bold">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/timeline"
                                    className="hover:text-info hover:underline"
                                >
                                    Event Timeline
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/website-source"
                                    className="hover:text-info hover:underline"
                                >
                                    Website Source Code
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/request"
                                    className="hover:text-info hover:underline"
                                >
                                    Request a Feature
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="mb-4 text-lg font-bold">Contact</h3>
                        <ul className="space-y-2">
                            <li>
                                Email:{" "}
                                <a
                                    href="mailto:cluna@grovetonisd.net"
                                    className="hover:text-info hover:underline"
                                >
                                    cluna@grovetonisd.net
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="text-muted-foreground mt-8 border-t pt-8 text-center">
                    <p>© 2025-2026 Carlos Luna</p>
                </div>
            </div>
        </footer>
    );
}
