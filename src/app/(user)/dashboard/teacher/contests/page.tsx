import { api } from "~/trpc/server";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import { Monitor, Pencil, PlusCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_STYLES = {
    draft: "bg-gray-100 text-gray-700",
    scheduled: "bg-blue-100 text-blue-700",
    active: "bg-green-100 text-green-700",
    frozen: "bg-amber-100 text-amber-700",
    ended: "bg-slate-100 text-slate-700",
} as const;

export default async function ContestsPage() {
    const contests = await api.contest.getAll();

    return (
        <div className="min-h-screen bg-gray-50 px-8 pt-20 pb-8">
            <div className="mb-8 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Contests</h1>
                <Button asChild>
                    <Link href="/dashboard/teacher/contests/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Contest
                    </Link>
                </Button>
            </div>

            {contests.length === 0 ? (
                <div className="rounded-lg border bg-white py-16 text-center">
                    <p className="text-sm text-gray-500">
                        No contests yet. Create your first one to get started.
                    </p>
                    <Button asChild className="mt-4">
                        <Link href="/dashboard/teacher/contests/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Contest
                        </Link>
                    </Button>
                </div>
            ) : (
                <div className="rounded-lg border bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Start</TableHead>
                                <TableHead>End</TableHead>
                                <TableHead>Problems</TableHead>
                                <TableHead>Participants</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contests.map((c) => (
                                <TableRow key={c.id}>
                                    <TableCell className="font-medium">
                                        {c.name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className={STATUS_STYLES[c.status]}
                                        >
                                            {c.status.charAt(0).toUpperCase() +
                                                c.status.slice(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {format(
                                            c.startsAt,
                                            "MMM d, yyyy HH:mm",
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {format(c.endsAt, "MMM d, yyyy HH:mm")}
                                    </TableCell>
                                    <TableCell>{c.problemCount}</TableCell>
                                    <TableCell>{c.participantCount}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                            >
                                                <Link
                                                    href={`/dashboard/teacher/contests/${c.id}`}
                                                >
                                                    <Monitor className="mr-1 h-3.5 w-3.5" />
                                                    Monitor
                                                </Link>
                                            </Button>
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                            >
                                                <Link
                                                    href={`/dashboard/teacher/contests/${c.id}/edit`}
                                                >
                                                    <Pencil className="mr-1 h-3.5 w-3.5" />
                                                    Edit
                                                </Link>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
