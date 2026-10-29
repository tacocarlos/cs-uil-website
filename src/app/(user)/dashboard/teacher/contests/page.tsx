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
import { getCurrentMembership } from "~/server/current-membership";
import { isSiteAdmin } from "~/lib/auth/roles";
import { isSchoolTeacher } from "~/server/organizations";
import { ContestStatusBadge } from "~/components/contest/contest-status-badge";
import { ContestInvitations } from "./invitations";

export const dynamic = "force-dynamic";

/** Contests the user manages, invitations, and other contests to follow. */
export default async function ContestsPage() {
    const { session, membership } = await getCurrentMembership();
    const siteAdmin = isSiteAdmin(session?.user.role);
    const isTeacher = isSchoolTeacher(membership);

    const [managed, visible] = await Promise.all([
        api.contest.getManaged(),
        // Teachers can follow their students in contests they don't manage.
        isTeacher ? api.contest.getAll() : [],
    ]);
    const managedIds = new Set(managed.map((c) => c.id));
    const others = visible.filter((c) => !managedIds.has(c.id));

    return (
        <div className="min-h-screen bg-gray-50 px-8 pt-20 pb-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Contests</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {siteAdmin
                            ? "As a site admin you manage every contest, and can create global contests or host one at any school."
                            : "Contests your school hosts. You can invite other schools to them."}
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/teacher/contests/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Contest
                    </Link>
                </Button>
            </div>

            {isTeacher && <ContestInvitations />}

            <section className="mb-8">
                <h2 className="mb-3 text-lg font-semibold">
                    {siteAdmin ? "All contests" : "Your school's contests"}
                </h2>
                {managed.length === 0 ? (
                    <div className="rounded-lg border bg-white py-12 text-center">
                        <p className="text-sm text-gray-500">
                            No contests yet. Create your first one to get
                            started.
                        </p>
                    </div>
                ) : (
                    <div className="rounded-lg border bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Host</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Start</TableHead>
                                    <TableHead>End</TableHead>
                                    <TableHead>Problems</TableHead>
                                    <TableHead>Participants</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {managed.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell className="font-medium">
                                            {c.name}
                                        </TableCell>
                                        <TableCell>
                                            {c.hostSchool ?? (
                                                <Badge variant="outline">
                                                    Global
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <ContestStatusBadge
                                                status={c.status}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {format(
                                                c.startsAt,
                                                "MMM d, yyyy HH:mm",
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {format(
                                                c.endsAt,
                                                "MMM d, yyyy HH:mm",
                                            )}
                                        </TableCell>
                                        <TableCell>{c.problemCount}</TableCell>
                                        <TableCell>
                                            {c.participantCount}
                                        </TableCell>
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
            </section>

            {others.length > 0 && (
                <section>
                    <h2 className="mb-1 text-lg font-semibold">
                        Other contests
                    </h2>
                    <p className="text-muted-foreground mb-3 text-sm">
                        Global contests and other schools&apos; contests your
                        students can join. Follow your own students&apos;
                        submissions in each.
                    </p>
                    <div className="rounded-lg border bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Host</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Start</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {others.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell className="font-medium">
                                            {c.name}
                                        </TableCell>
                                        <TableCell>
                                            {c.hostSchool ?? (
                                                <Badge variant="outline">
                                                    Global
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <ContestStatusBadge
                                                status={c.status}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {format(
                                                c.startsAt,
                                                "MMM d, yyyy HH:mm",
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                            >
                                                <Link
                                                    href={`/dashboard/teacher/contests/${c.id}`}
                                                >
                                                    <Monitor className="mr-1 h-3.5 w-3.5" />
                                                    Your students
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </section>
            )}
        </div>
    );
}
