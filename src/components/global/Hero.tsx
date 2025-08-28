import Link from "next/link";
import Image from "next/image";

const Hero = () => {
  return (
    <section className="bg-primary text-primary-foreground relative flex h-[45vh] items-center justify-center overflow-hidden">
      <div className="z-10 container mx-auto px-4 text-center">
        <h1 className="mb-4 text-4xl font-bold md:text-6xl">
          CS UIL 2025-2026
        </h1>
        <p className="mx-auto mb-8 max-w-3xl text-xl md:text-2xl">
          Compete, learn, and excel in computer science competitions
        </p>
        <Link
          href="/resources"
          className="border-primary-foreground bg-accent text-secondary-foreground hover:bg-primary hover:text-primary-foreground rounded-lg border-2 px-8 py-3 transition-colors"
        >
          View Resources
        </Link>
      </div>
    </section>
  );
};

export default Hero;
