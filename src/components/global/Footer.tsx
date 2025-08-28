import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-secondary px-4 py-8 text-secondary-foreground">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-bold">CS UIL 2025-2026</h3>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-bold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/competition-timeline"
                  className="hover:text-accent-foreground"
                >
                  Competition Timeline
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-bold">Contact</h3>
            <ul className="space-y-2 text-gray-400">
              <li className="text-secondary-foreground">Email: <a href="mailto:cluna@grovetonisd.net" className="hover:text-accent-foreground">cluna@grovetonisd.net</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-700 pt-8 text-center text-gray-400">
          <p>© 2025-2026 Carlos Luna</p>
        </div>
      </div>
    </footer>
  );
}
