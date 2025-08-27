import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center bg-blue-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image
            src="/code-bg.jpg"
            alt="Code Background"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="container mx-auto px-4 z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            CS UIL 2025-2026
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Compete, learn, and excel in computer science competitions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Register Now
            </Link>
            <Link
              href="/resources"
              className="bg-transparent hover:bg-blue-800 border-2 border-white py-3 px-8 rounded-lg transition-colors"
            >
              View Resources
            </Link>
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-blue-900">
            Why Participate in CS UIL?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Develop Skills",
                description:
                  "Enhance your programming abilities, problem-solving skills, and algorithmic thinking.",
                icon: "💻",
              },
              {
                title: "Compete & Win",
                description:
                  "Represent your school in district, regional, and state competitions with chances to win awards.",
                icon: "🏆",
              },
              {
                title: "Build Your Future",
                description:
                  "Strengthen your college applications and prepare for careers in computer science.",
                icon: "🚀",
              },
            ].map((card, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="text-4xl mb-4">{card.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-blue-900">
                  {card.title}
                </h3>
                <p className="text-gray-600">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competition Timeline */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-blue-900">
            2025-2026 Competition Timeline
          </h2>
          <div className="max-w-3xl mx-auto">
            {[
              {
                date: "September 2025",
                event: "Practice Sessions Begin",
                description:
                  "Weekly practice sessions start at participating schools.",
              },
              {
                date: "November 2025",
                event: "Invitational Meets",
                description:
                  "First round of invitational competitions to prepare for district.",
              },
              {
                date: "February 2026",
                event: "District Competitions",
                description:
                  "Qualify for regionals by competing at the district level.",
              },
              {
                date: "April 2026",
                event: "Regional Competitions",
                description: "Top teams advance to the state competition.",
              },
              {
                date: "May 2026",
                event: "State Competition",
                description:
                  "The best CS UIL teams across Texas compete for state championships.",
              },
            ].map((event, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row mb-8 bg-white p-6 rounded-lg shadow-md"
              >
                <div className="md:w-1/3 font-bold text-blue-700 mb-2 md:mb-0">
                  {event.date}
                </div>
                <div className="md:w-2/3">
                  <h3 className="font-bold text-lg mb-1">{event.event}</h3>
                  <p className="text-gray-600">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources Preview */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-blue-900">
            Preparation Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Practice Problems",
                description: "Access previous years' competition problems",
                link: "/resources/practice",
              },
              {
                title: "Study Guides",
                description: "Comprehensive guides for all CS UIL categories",
                link: "/resources/guides",
              },
              {
                title: "Video Tutorials",
                description: "Step-by-step tutorials for common algorithms",
                link: "/resources/tutorials",
              },
              {
                title: "Mock Competitions",
                description: "Simulate competition environments online",
                link: "/resources/mock",
              },
            ].map((resource, index) => (
              <Link
                href={resource.link}
                key={index}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500"
              >
                <h3 className="font-bold text-lg mb-2 text-blue-900">
                  {resource.title}
                </h3>
                <p className="text-gray-600 mb-3">{resource.description}</p>
                <span className="text-blue-600 font-medium">Learn more →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-blue-900 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join your school's CS UIL team today and begin your journey to the
            state competition!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Register Now
            </Link>
            <Link
              href="/contact"
              className="bg-transparent hover:bg-blue-800 border-2 border-white py-3 px-8 rounded-lg transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">CS UIL 2025-2026</h3>
              <p className="text-gray-400">
                Promoting computer science education and competition excellence
                in high schools.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-white">
                    About UIL
                  </Link>
                </li>
                <li>
                  <Link href="/events" className="text-gray-400 hover:text-white">
                    Events
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="text-gray-400 hover:text-white">
                    Resources
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-gray-400 hover:text-white">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Email: info@csuil.edu</li>
                <li>Phone: (555) 123-4567</li>
                <li>Twitter: @CSUIL</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Newsletter</h3>
              <p className="text-gray-400 mb-4">
                Stay updated with competition news and resources.
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="px-4 py-2 rounded-l-lg w-full text-gray-800"
                />
                <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-r-lg">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>© 2025-2026 CS UIL. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}