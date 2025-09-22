"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { formSchema } from "./form-schema";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
    CompetitionLevel,
    CompetitionYear,
    ProblemName,
    ProblemText,
    ProgramName,
    InputFileName,
    DefaultInputFile,
    TestInput,
    TestOutput,
    EnabledToggle,
    SampleOutput,
    Code,
} from "./form-items";
import { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { useFilePicker } from "use-file-picker";
import { type SelectedFiles } from "use-file-picker/types";
import path from "path";

export function NewProblemForm() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            problemName: "Problem",
            competitionYear: new Date().getFullYear(),
            competitionLevel: "custom",
            problemText: "",
            programName: "",
            inputFileName: "",
            defaultInputFile: "",
            testInput: "",
            testOutput: "",
            code: "",
        },
    });
    const addProblem = api.problem.addProblem.useMutation({
        onSuccess: () => {
            toast("Submitted Problem");
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        if (!confirm("Are you sure?")) {
            return;
        }

        toast("", {
            description: (
                <pre className="text-black">
                    {JSON.stringify(values, null, 2)}
                </pre>
            ),
        });
        addProblem.mutate(values);
    }

    const { openFilePicker, filesContent, loading } = useFilePicker({
        multiple: true,
        onFilesSuccessfullySelected: async ({
            filesContent,
        }: SelectedFiles<string>) => {
            const getFile = (ext: string) =>
                filesContent.find((f) => f.name.includes(ext));
            const dataFileName = getFile(".dat")?.name;
            const codeFileName = getFile(".java")?.name;
            const dataFile = getFile(".dat")?.content.replaceAll("\r", "");
            const codeFile = getFile(".java")?.content.replaceAll("\r", "");
            const outputFile = getFile(".out")?.content.replaceAll("\r", "");
            const problemName = path.parse(
                getFile(".java")?.name ?? "Problem.java",
            ).name;

            const data = {
                inputFileName: dataFileName,
                testInput: dataFile,
                testOutput: outputFile,
                code: codeFile,
                programName: codeFileName,
                problemName,
            };

            form.reset(data);
            console.dir(data);
            toast("Loaded Files", {
                description: <pre>{JSON.stringify(data)}</pre>,
            });
        },
    });

    return (
        <Form {...form}>
            <span className="space-x-6">
                <Button
                    onClick={() => {
                        openFilePicker();
                    }}
                >
                    Import data from Files
                </Button>
            </span>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="mt-5 space-y-8"
            >
                <ProblemName form={form} />
                <EnabledToggle form={form} />
                <CompetitionYear form={form} />
                <CompetitionLevel form={form} />
                <ProblemText form={form} />
                <ProgramName form={form} />
                <InputFileName form={form}></InputFileName>
                <DefaultInputFile form={form}></DefaultInputFile>
                <SampleOutput form={form} />
                <Code form={form} />
                <TestInput form={form}></TestInput>
                <TestOutput form={form}></TestOutput>
                <Button type="submit">Submit</Button>
            </form>
        </Form>
    );
}
