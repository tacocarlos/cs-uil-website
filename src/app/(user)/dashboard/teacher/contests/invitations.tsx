"use client";

import { format } from "date-fns";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";

/**
 * Other schools' invitations to the teacher's school, which the teacher
 * can decline (hiding the contest from their students) or accept again.
 */
export function ContestInvitations() {
    const utils = api.useUtils();
    const { data: invitations } = api.contest.getInvitations.useQuery();
    const respond = api.contest.respondToInvitation.useMutation({
        onSuccess: async (_, { decline }) => {
            toast.success(
                decline ? "Invitation declined" : "Invitation accepted",
            );
            await utils.contest.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });

    if (!invitations?.length) return null;

    return (
        <section className="mb-8">
            <h2 className="mb-1 text-lg font-semibold">Invitations</h2>
            <p className="text-muted-foreground mb-3 text-sm">
                Contests other schools invited yours to. Declining hides the
                contest from your students; anyone already enrolled keeps their
                results.
            </p>
            <div className="rounded-lg border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Contest</TableHead>
                            <TableHead>Host</TableHead>
                            <TableHead>Start</TableHead>
                            <TableHead>Response</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invitations.map((inv) => (
                            <TableRow key={inv.contestId}>
                                <TableCell className="font-medium">
                                    {inv.name}
                                </TableCell>
                                <TableCell>{inv.hostSchool}</TableCell>
                                <TableCell>
                                    {format(inv.startsAt, "MMM d, yyyy HH:mm")}
                                </TableCell>
                                <TableCell>
                                    {inv.declinedAt ? (
                                        <Badge variant="outline">
                                            Declined
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-green-100 text-green-800">
                                            Taking part
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={respond.isPending}
                                        onClick={() =>
                                            respond.mutate({
                                                contestId: inv.contestId,
                                                decline: !inv.declinedAt,
                                            })
                                        }
                                    >
                                        {inv.declinedAt ? "Accept" : "Decline"}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </section>
    );
}
