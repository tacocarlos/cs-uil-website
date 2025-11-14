"use client";

import { WrittenScoreForm } from "./written-score-form";

export default function AddWrittenScorePage() {
    return (
        <div className="bg-primary flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
            <div className="bg-secondary w-full max-w-2xl rounded-xl p-10">
                <h1 className="mb-6 text-center text-3xl font-bold">
                    Add Written Test Score
                </h1>
                <WrittenScoreForm />
            </div>
        </div>
    );
}
