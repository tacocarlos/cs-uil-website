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

export function NewProblemForm() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            problemName: "Problem",
            competitionYear: new Date().getFullYear(),
            competitionLevel: "custom",
            problemText: "Problem Text",
            programName: "Program.java",
            inputFileName: "",
            defaultInputFile: "",
            testInput: "",
            testOutput: "",
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.dir(values);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="problemName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Problem Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Problem Name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit">Submit</Button>
            </form>
        </Form>
    );
}
