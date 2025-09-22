"use client";
import { NewProblemForm } from "../problem-form";

export default function NewProblemPage() {
    return (
        <div className="bg-primary flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
            <div className="bg-secondary rounded-xl p-10 md:w-3/4">
                <NewProblemForm />
            </div>
        </div>
    );
}
