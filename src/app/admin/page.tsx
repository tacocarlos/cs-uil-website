import { SchoolList } from "./school-list";

export default function AdminPage() {
    return (
        <main className="min-h-screen bg-gray-50 px-8 pt-20 pb-8">
            <div className="mx-auto max-w-5xl">
                <h1 className="mb-6 text-2xl font-bold">Site admin</h1>
                <SchoolList />
            </div>
        </main>
    );
}
