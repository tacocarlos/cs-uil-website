import Link from "next/link";
import { Button } from "~/components/ui/button";
import { CreateSchool } from "./create-school";
import { SchoolList } from "./school-list";

export default function AdminPage() {
    return (
        <main className="min-h-screen bg-gray-50 px-8 pt-24 pb-8">
            <div className="mx-auto max-w-5xl space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Site admin</h1>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href="/admin/requests">Feature requests</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/dashboard/teacher/contests">
                                Manage contests
                            </Link>
                        </Button>
                    </div>
                </div>
                <CreateSchool />
                <SchoolList />
            </div>
        </main>
    );
}
