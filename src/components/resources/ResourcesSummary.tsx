import Link from "next/link";

export type ResourceItemType = {
  title: string,
  description: string,
  href: string
}

export default function ResourcesSummary() {
  return (
    <section className="px-4 py-16">
      <div className="container mx-auto">
        <h2 className="mb-12 text-center text-3xl font-bold text-blue-900">
          Preparation Resources
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          ].map((resource, index) => (
            <p
              // href={resource.link}
              key={index}
              className="text-gray-500 bg-gray-400  rounded-lg border-l-4 border-blue-500 p-6 shadow-md transition-shadow hover:shadow-lg"
            >
              <h3 className="mb-2 text-lg font-bold">
                {resource.title}
              </h3>
              <p className="mb-3 text-gray-600">{resource.description}</p>
              <span className="font-medium ">Learn more →</span>
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
