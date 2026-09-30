import { CreateSchool } from "./create-school";
import { SchoolList } from "./school-list";

export default function AdminPage() {
    return (
        <main className="min-h-screen bg-gray-50 px-8 pt-24 pb-8">
            <div className="mx-auto max-w-5xl space-y-6">
                <h1 className="text-2xl font-bold">Site admin</h1>
                <CreateSchool />
                <SchoolList />
            </div>
        </main>
    );
}
