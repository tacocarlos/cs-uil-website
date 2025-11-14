"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { writtenScoreFormSchema } from "./form-schema";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { useState } from "react";

export function WrittenScoreForm() {
    const [searchTerm, setSearchTerm] = useState("");

    const form = useForm<z.infer<typeof writtenScoreFormSchema>>({
        resolver: zodResolver(writtenScoreFormSchema),
        defaultValues: {
            userId: "",
            competition: "VCM-1",
            score: 0,
            accuracy: undefined,
            takenAt: new Date().toISOString().split("T")[0],
        },
    });

    const { data: users, isLoading: usersLoading } =
        api.written.getAllUsers.useQuery();

    const addScore = api.written.addScore.useMutation({
        onSuccess: () => {
            toast.success("Written test score added successfully!");
            form.reset();
        },
        onError: (error) => {
            toast.error("Failed to add score: " + error.message);
        },
    });

    function onSubmit(values: z.infer<typeof writtenScoreFormSchema>) {
        if (!confirm("Are you sure you want to add this score?")) {
            return;
        }

        addScore.mutate(values);
    }

    // Filter users by search term
    const filteredUsers = users?.filter(
        (user) =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Student</FormLabel>
                            <div className="space-y-2">
                                <Input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="w-full"
                                />
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a student" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="max-h-[300px]">
                                        {usersLoading ? (
                                            <SelectItem
                                                value="loading"
                                                disabled
                                            >
                                                Loading users...
                                            </SelectItem>
                                        ) : filteredUsers &&
                                          filteredUsers.length > 0 ? (
                                            filteredUsers.map((user) => (
                                                <SelectItem
                                                    key={user.id}
                                                    value={user.id}
                                                >
                                                    {user.name} ({user.email})
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none" disabled>
                                                No users found
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <FormDescription>
                                Select the student who took the test
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="competition"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Competition</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a competition" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="VCM-1">VCM-1</SelectItem>
                                    <SelectItem value="VCM-2">VCM-2</SelectItem>
                                    <SelectItem value="VCM-3">VCM-3</SelectItem>
                                    <SelectItem value="VCM-4">VCM-4</SelectItem>
                                    <SelectItem value="regionA">
                                        Region A
                                    </SelectItem>
                                    <SelectItem value="regionB">
                                        Region B
                                    </SelectItem>
                                    <SelectItem value="district">
                                        District
                                    </SelectItem>
                                    <SelectItem value="region">
                                        Region
                                    </SelectItem>
                                    <SelectItem value="state">State</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Which competition was this test from?
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="score"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Score</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="Enter score (0-100)"
                                    {...field}
                                    onChange={(e) =>
                                        field.onChange(
                                            parseInt(e.target.value) || 0,
                                        )
                                    }
                                />
                            </FormControl>
                            <FormDescription>
                                Test score out of 100
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="accuracy"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Accuracy (Optional)</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    placeholder="Enter accuracy (0-1)"
                                    value={field.value ?? ""}
                                    onChange={(e) =>
                                        field.onChange(
                                            e.target.value
                                                ? parseFloat(e.target.value)
                                                : undefined,
                                        )
                                    }
                                />
                            </FormControl>
                            <FormDescription>
                                Accuracy as a decimal (e.g., 0.85 for 85%)
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="takenAt"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Date Taken (Optional)</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormDescription>
                                When was this test taken? (defaults to today)
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    disabled={addScore.isPending}
                    className="w-full"
                >
                    {addScore.isPending ? "Adding Score..." : "Add Score"}
                </Button>
            </form>
        </Form>
    );
}
