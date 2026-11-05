import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import type { IOTab, TestIOState } from "./use-test-io";

/** Testcase input, program output, and errors, as tabs. */
export function IOPanel({
    io,
    inputLabel = "Testcase",
    showResetInput = true,
}: {
    io: TestIOState;
    inputLabel?: string;
    /** Offer "Reset to Default"; pointless when there's no default input. */
    showResetInput?: boolean;
}) {
    const tabLabels: Record<IOTab, string> = {
        input: inputLabel,
        stdout: "Output",
        stderr: "Errors",
    };
    return (
        <div className="bg-background flex h-full flex-col">
            <Tabs
                value={io.tab}
                onValueChange={(tab) => io.setTab(tab as IOTab)}
                className="flex h-full flex-col overflow-y-auto"
            >
                <div className="bg-card flex w-full items-center justify-between border-b px-4">
                    <TabsList className="justify-start border-none bg-transparent">
                        {(Object.keys(tabLabels) as IOTab[]).map((tab) => (
                            <TabsTrigger
                                key={tab}
                                value={tab}
                                className="text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground dark:data-[state=active]:bg-muted"
                            >
                                {tabLabels[tab]}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {showResetInput && io.tab === "input" && (
                        <ResetInputDialog onConfirm={io.resetInput} />
                    )}
                </div>

                <IOTextarea
                    tab="input"
                    value={io.input}
                    onChange={io.setInput}
                    placeholder="Enter test input..."
                />
                <IOTextarea
                    tab="stdout"
                    value={io.stdout}
                    placeholder="Run code to see output..."
                />
                <IOTextarea
                    tab="stderr"
                    value={io.stderr}
                    placeholder="Errors will appear here..."
                    className="text-destructive"
                />
            </Tabs>
        </div>
    );
}

/** A tab's textarea; read-only unless `onChange` is given. */
function IOTextarea({
    tab,
    value,
    onChange,
    placeholder,
    className,
}: {
    tab: IOTab;
    value: string;
    onChange?: (value: string) => void;
    placeholder: string;
    className?: string;
}) {
    return (
        <TabsContent value={tab} className="h-full flex-1 p-4">
            <Textarea
                className={cn(
                    "bg-card h-full w-full resize-none font-mono text-base md:text-sm",
                    className,
                )}
                value={value}
                readOnly={!onChange}
                onChange={onChange && ((e) => onChange(e.target.value))}
                placeholder={placeholder}
            />
        </TabsContent>
    );
}

function ResetInputDialog({ onConfirm }: { onConfirm: () => void }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground h-8 text-xs"
                >
                    Reset to Default
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Reset test input?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will reset the test input to the default value. Any
                        custom input you{"'"}ve entered will be lost.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>
                        Reset
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
