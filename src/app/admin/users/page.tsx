import Link from "next/link";
import { Button } from "~/components/ui/button";
import { UserList } from "./user-list";

export default function AdminUsersPage() {
    return (
        <div className="min-h-screen px-4 pt-24 pb-8 sm:px-8">
            <div className="mx-auto max-w-5xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h1 className="text-2xl font-bold">Users</h1>
                    <Button asChild variant="outline">
                        <Link href="/admin">Back to site admin</Link>
                    </Button>
                </div>
                <UserList />
            </div>
        </div>
    );
}
