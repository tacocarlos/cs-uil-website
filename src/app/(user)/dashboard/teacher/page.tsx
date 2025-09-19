"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";

export default function TeacherDashboard() {
    const router = useRouter();
    return (
        <div className="bg-primary flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
            <div className="bg-secondary w-fit rounded p-5">
                <div>
                    <Button asChild>
                        <Link href="/dashboard/teacher/new/problem">
                            Add New Problem
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
