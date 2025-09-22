import {
    type ControllerRenderProps,
    type UseFormReturn,
} from "react-hook-form";
import { CompetitionLevelEnum, formSchema } from "./form-schema";
import {
    FormItem,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
    FormField,
} from "~/components/ui/form";
import { z } from "zod";
import { Input } from "~/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { problems } from "~/server/db/schema/problem";
import type { JSX, ReactNode } from "react";
import { Checkbox } from "~/components/ui/checkbox";
import { Switch } from "~/components/ui/switch";

type FormSchemaType = z.infer<typeof formSchema>;

type FormType = UseFormReturn<FormSchemaType>;

type ItemProps = {
    form: FormType;
};

type GenericShortTextFieldProps = ItemProps & {
    fieldName: any; // TODO: fix this type error; need to find out how to reference the field name type
    label: string;
    inputPlaceholder?: string;
    fieldDescription?: string;
    variant?: "input" | "textarea" | "markdown";
    type?: "string" | "number";
};

function GenericTextField({
    form,
    fieldName,
    label,
    inputPlaceholder,
    fieldDescription,
    variant = "input",
    type = "string",
}: GenericShortTextFieldProps) {
    inputPlaceholder = inputPlaceholder ?? "";
    function Control({
        field,
    }: {
        field: ControllerRenderProps<FormSchemaType>;
    }) {
        switch (variant) {
            case "input":
                if (type === "number") {
                    return (
                        <Input
                            placeholder={inputPlaceholder}
                            {...field}
                            onChange={field.onChange}
                            value={
                                typeof field.value === "boolean"
                                    ? String(field.value)
                                    : field.value
                            }
                            type="number"
                        />
                    );
                } else {
                    return (
                        <Input
                            placeholder={inputPlaceholder}
                            {...field}
                            onChange={field.onChange}
                            value={
                                typeof field.value === "boolean"
                                    ? String(field.value)
                                    : field.value
                            }
                        />
                    );
                }
            case "textarea":
            case "markdown":
                return (
                    <Textarea
                        placeholder={inputPlaceholder}
                        className="h-50px resize-none md:h-[250px]"
                        {...field}
                        value={
                            typeof field.value === "boolean"
                                ? String(field.value)
                                : field.value
                        }
                    />
                );
        }
    }
    return (
        <FormField
            control={form.control}
            name={fieldName}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                        <Control field={field} />
                    </FormControl>
                    <FormDescription>{fieldDescription}</FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

export function ProblemName({ form }: ItemProps) {
    return (
        <GenericTextField
            form={form}
            fieldName="problemName"
            label="Problem Name"
            inputPlaceholder="Problem Name"
            fieldDescription="Description"
        />
    );
}

export function CompetitionYear({ form }: ItemProps) {
    return (
        <FormField
            control={form.control}
            name="competitionYear"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{"Competition Year"}</FormLabel>
                    <FormControl>
                        <Input
                            placeholder="Competition Year"
                            {...field}
                            type="number"
                        />
                    </FormControl>
                    <FormDescription>The year of the contest.</FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

export function CompetitionLevel({ form }: ItemProps) {
    function enumToDisplay(level: string) {
        switch (level) {
            case "invA":
                return "Invitational A";
            case "invB":
                return "Invitational B";
            case "district":
                return "District";
            case "region":
                return "Region";
            case "state":
                return "State";
            case "custom":
                return "Custom";
            default:
                "";
        }
    }

    return (
        <FormField
            control={form.control}
            name="competitionLevel"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Competition Level</FormLabel>
                    <FormControl>
                        <Select
                            onValueChange={field.onChange}
                            value={field.value}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Level" />
                            </SelectTrigger>
                            <SelectContent>
                                {CompetitionLevelEnum.options.map((lvl) => (
                                    <SelectItem value={lvl} key={lvl}>
                                        {enumToDisplay(lvl)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

export function ProblemText({ form }: ItemProps) {
    return (
        <GenericTextField
            form={form}
            fieldName="problemText"
            label="Problem Text"
            variant="markdown"
        />
    );
}

export function ProgramName({ form }: ItemProps) {
    return (
        <GenericTextField
            form={form}
            fieldName="programName"
            label="Program Name"
            inputPlaceholder="Enter The Program Name"
            fieldDescription=""
        />
    );
}

export function InputFileName({ form }: ItemProps) {
    return (
        <GenericTextField
            form={form}
            fieldName="inputFileName"
            label="Problem Input File Name"
            inputPlaceholder="File Name"
            fieldDescription="The file name associated with the problem: e.g., `problem.dat`"
        />
    );
}

export function DefaultInputFile({ form }: ItemProps) {
    return (
        <GenericTextField
            form={form}
            fieldName="defaultInputFile"
            label="Problem Example Input"
            inputPlaceholder="File Input"
            fieldDescription="The example input given for the problem"
            variant="textarea"
        />
    );
}

export function TestInput({ form }: ItemProps) {
    return (
        <GenericTextField
            form={form}
            fieldName="testInput"
            label="Submission Testing Input"
            variant="textarea"
        />
    );
}

export function SampleOutput({ form }: ItemProps) {
    return (
        <GenericTextField
            form={form}
            fieldName="sampleOutput"
            label="Sample Problem Output"
            variant="textarea"
        />
    );
}

export function TestOutput({ form }: ItemProps) {
    return (
        <GenericTextField
            form={form}
            fieldName="testOutput"
            label="Submission Testing Output"
            variant="textarea"
        />
    );
}

export function EnabledToggle({ form }: ItemProps) {
    return (
        <FormField
            control={form.control}
            name="enabled"
            render={({ field }) => (
                <FormItem>
                    <FormItem>
                        <FormLabel>Show in Problem List</FormLabel>
                        <FormControl>
                            <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <FormMessage></FormMessage>
                    </FormItem>
                </FormItem>
            )}
        />
    );
}

export function Code({ form }: ItemProps) {
    return (
        <GenericTextField
            form={form}
            fieldName="code"
            label="Solution Code"
            fieldDescription="Code from the official solution"
            variant="textarea"
            type="string"
        />
    );
}
