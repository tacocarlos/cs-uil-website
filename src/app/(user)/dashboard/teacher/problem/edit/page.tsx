"use client";
import { api } from "~/trpc/react";
import { NewProblemForm } from "../problem-form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";

export default function EditProblemPage() {
    const problemsQuery = api.problem.getProblems.useQuery();
    const problems = problemsQuery.data ?? [];
    return (
        <div className="bg-primary flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
            <div className="bg-secondary space-y-5 rounded-xl p-10 md:w-3/4">
                <Select>
                    <SelectTrigger>
                        <SelectValue placeholder="Problem" />
                    </SelectTrigger>
                    <SelectContent>
                        {problems.map((p) => {
                            return (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                    {p.competitionYear}: {p.competitionLevel} -{" "}
                                    {p.problemName}
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
                <NewProblemForm />
            </div>
        </div>
    );
}
