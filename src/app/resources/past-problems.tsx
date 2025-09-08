import Link from "next/link";

export default function PastProblems() {
    return (
        <section className="bg-primary text-primary-foreground relative flex h-[40vh] items-center justify-center overflow-hidden">
            <div className="z-10 container mx-auto flex flex-col space-y-2 px-4 text-center">
                <h1 className="text-3xl font-bold">Programming Problems</h1>
                <Link
                    href="/resources/past-problem"
                    className="bg-accent text-accent-foreground w-1/2 self-center rounded-md px-2 py-3 shadow-md transition-shadow hover:shadow-lg"
                >
                    <span className="font-medium">Learn more →</span>
                </Link>{" "}
            </div>
        </section>
    );
}
