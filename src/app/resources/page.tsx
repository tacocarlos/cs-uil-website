import PastProblems from "./past-problems";

export default function Resources() {
    return (
        <>
            <PastProblems />
            <section className="bg-primary text-primary-foreground relative flex h-[45vh] items-center justify-center overflow-hidden">
                <ul className="space-y-2 text-blue-600">
                    <li className="block rounded px-4 py-2 transition-colors hover:bg-blue-50">
                        <a href="https://ocw.mit.edu/courses/6-092-introduction-to-programming-in-java-january-iap-2010/">
                            MIT OpenCourseWare Intro To Java
                        </a>
                    </li>
                    <li className="block rounded px-4 py-2 transition-colors hover:bg-blue-50">
                        <a href="https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/">
                            MIT OpenCourseWare Introduction to Algorithms
                        </a>
                    </li>
                </ul>
            </section>
        </>
    );
}
