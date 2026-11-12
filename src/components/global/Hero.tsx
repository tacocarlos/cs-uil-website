import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";

const Hero = () => {
    return (
        <section className="bg-primary text-primary-foreground relative flex h-[45vh] items-center justify-center overflow-hidden pt-16">
            <div className="z-10 container mx-auto px-4 text-center">
                <h1 className="mb-4 text-4xl font-bold md:text-6xl">
                    CS UIL 2025-2026
                </h1>
                <p className="mx-auto mb-8 max-w-3xl text-xl md:text-2xl">
                    Compete, learn, and excel in computer science competitions
                </p>
                <Button variant="outline" asChild effect="expandIcon" icon={ArrowRight} iconPlacement="right">
                    <Link
                        href="/resources"
                        className="bg-highlight text-highlight-foreground hover:text-highlight-foreground hover:bg-highlight/90 rounded-lg px-8 py-3 font-medium shadow-md transition-colors"
                    >
                        View Resources
                    </Link>
                </Button>
            </div>
        </section>
    );
};

export default Hero;
