import { eq } from "drizzle-orm";
import { getCurrentMembership } from "~/server/current-membership";
import { db } from "~/server/db";
import { organization } from "~/server/db/schema/organization";
import {
    EXPORT_KINDS,
    programmingSubmissionsCsv,
    writtenScoresCsv,
    type ExportKind,
} from "~/server/exports";
import { isSchoolTeacher } from "~/server/organizations";

export const dynamic = "force-dynamic";

const BUILDERS: Record<
    ExportKind,
    (organizationId: string) => Promise<string>
> = {
    written: writtenScoresCsv,
    programming: programmingSubmissionsCsv,
};

/**
 * Downloads a CSV of the active school's written scores or programming
 * submissions. Route handlers skip the teacher layout, so this checks for a
 * teacher itself.
 */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ kind: string }> },
) {
    const { kind } = await params;
    const exportKind = EXPORT_KINDS.find((k) => k === kind);
    if (!exportKind) return new Response("Not found", { status: 404 });

    const { session, membership } = await getCurrentMembership();
    if (!session) return new Response("Sign in first", { status: 401 });
    if (!membership || !isSchoolTeacher(membership)) {
        return new Response("Only teachers can export data", { status: 403 });
    }

    const [csv, [school]] = await Promise.all([
        BUILDERS[exportKind](membership.organizationId),
        db
            .select({ slug: organization.slug })
            .from(organization)
            .where(eq(organization.id, membership.organizationId))
            .limit(1),
    ]);
    const date = new Date().toISOString().slice(0, 10);
    const filename = `${school?.slug ?? "school"}-${exportKind}-${date}.csv`;

    return new Response(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "no-store",
        },
    });
}
