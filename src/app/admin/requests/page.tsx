import Link from "next/link";
import { Button } from "~/components/ui/button";
import { RequestQueue } from "./request-queue";

export default function AdminRequestsPage() {
    return (
        <main className="min-h-screen bg-gray-50 px-8 pt-24 pb-8">
            <div className="mx-auto max-w-5xl space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Feature requests</h1>
                    <Button asChild variant="outline">
                        <Link href="/admin">Back to site admin</Link>
                    </Button>
                </div>
                <RequestQueue />
            </div>
        </main>
    );
}
