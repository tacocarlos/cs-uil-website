import Link from "next/link";
import { Button } from "@components/ui/button";

export default function SkillTreeSelectorPage() {
    return (
        <div className="grid h-screen place-items-center">
            <span className="flex space-x-5">
                <Button asChild variant="secondary">
                    <Link href="/resources/skill-tree/apcsa">
                        Expected Codio Progress
                    </Link>
                </Button>
                <Button asChild className="bg-blue-600 hover:bg-blue-900">
                    <Link href="/resources/skill-tree/theoretical">
                        Computer Science (Theoretical) Progress
                    </Link>
                </Button>
            </span>
        </div>
    );
}
