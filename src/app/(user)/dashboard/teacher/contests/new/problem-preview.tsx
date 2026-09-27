import { Loader2, Plus } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeMathjax from "rehype-mathjax";
import { api } from "~/trpc/react";
import type { ApiMinimalProblem } from "~/lib/api/lunaghs";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

/** Description and sample I/O for a problem, with an "Add to contest" button. */
export function ProblemPreview({
    problem,
    isAdded,
    onAdd,
}: {
    problem: ApiMinimalProblem | null;
    isAdded: boolean;
    onAdd: (problem: ApiMinimalProblem) => void;
}) {
    return (
        <div className="flex h-full flex-col overflow-hidden rounded-md border bg-white">
            {problem ? (
                <>
                    <div className="shrink-0 border-b px-4 pt-3 pb-2">
                        <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">
                            #{problem.id} &middot; No. {problem.number}
                        </p>
                        <h3 className="mt-0.5 text-sm leading-snug font-semibold">
                            {problem.name}
                        </h3>
                        {isAdded && (
                            <p className="mt-1 text-xs font-medium text-green-600">
                                ✓ Already added to this contest
                            </p>
                        )}
                    </div>

                    <PreviewTabs problemId={problem.id} />

                    <div className="shrink-0 border-t p-3">
                        <Button
                            className="w-full"
                            disabled={isAdded}
                            onClick={() => onAdd(problem)}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            {isAdded ? "Already added" : "Add to contest"}
                        </Button>
                    </div>
                </>
            ) : (
                <div className="flex h-full items-center justify-center p-6 text-center text-sm text-gray-400">
                    Click a problem on the left to preview it here.
                </div>
            )}
        </div>
    );
}

function PreviewTabs({ problemId }: { problemId: number }) {
    const { data, isLoading } = api.problem.getProblemPreview.useQuery({
        id: problemId,
    });

    return (
        <Tabs
            defaultValue="description"
            className="flex min-h-0 flex-1 flex-col"
        >
            <TabsList className="mx-3 mt-2 mb-1 w-fit shrink-0">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="io">Sample I/O</TabsTrigger>
            </TabsList>

            {isLoading ? (
                <div className="flex flex-1 items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
            ) : (
                <>
                    <TabsContent
                        value="description"
                        className="mt-0 min-h-0 flex-1 overflow-y-auto px-4 pb-2"
                    >
                        <div className="prose prose-sm max-w-none">
                            <Markdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeMathjax]}
                            >
                                {data?.markdown ||
                                    "*No description available.*"}
                            </Markdown>
                        </div>
                    </TabsContent>

                    <TabsContent
                        value="io"
                        className="mt-0 min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-2"
                    >
                        <SampleBlock
                            title="Sample Input"
                            text={
                                data?.sampleInput ??
                                "No input given for this problem."
                            }
                        />
                        <SampleBlock
                            title="Sample Output"
                            text={
                                data?.sampleOutput ??
                                "No output given for this problem."
                            }
                        />
                    </TabsContent>
                </>
            )}
        </Tabs>
    );
}

function SampleBlock({ title, text }: { title: string; text: string }) {
    return (
        <div>
            <p className="mb-1 text-xs font-medium text-gray-500">{title}</p>
            <pre className="bg-muted overflow-x-auto rounded p-2 font-mono text-xs whitespace-pre-wrap">
                {text}
            </pre>
        </div>
    );
}
