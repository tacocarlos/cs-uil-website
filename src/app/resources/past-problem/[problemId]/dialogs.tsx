import { Dialog } from "~/components/ui/dialog";
import type { Submission } from "~/server/db/schema/submission";

function ResultDialog({ submission }: { submission: Submission }) {
    return <Dialog></Dialog>;
}

export function SuccessDialog({ submission }: { submission: Submission }) {}
