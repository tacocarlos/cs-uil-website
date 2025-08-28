import Link from "next/link";

export default function ResourcesSummary() {
  return (
    <section className="px-4 py-16">
      <div className="container mx-auto">
        <h2 className="mb-12 text-center text-3xl font-bold text-blue-900">
          Preparation Resources
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
              className="rounded-lg border-l-4 border-blue-500 bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
            >
              <h3 className="mb-2 text-lg font-bold text-blue-900">
                {resource.title}
              </h3>
              <p className="mb-3 text-gray-600">{resource.description}</p>
              <span className="font-medium text-blue-600">Learn more →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
