"use client";
import Markdown from "react-markdown";
import rehypeMathjax from "rehype-mathjax";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { Button } from "~/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog";
import {
    ACCEPTANCE_DISTANCE_THRESHOLD,
    DEFAULT_MAX_POINTS,
    PRACTICE_PENALTIES,
    PRACTICE_SCORING,
} from "~/lib/problems/scoring";

const penalty = PRACTICE_PENALTIES[PRACTICE_SCORING];
const pointsOff = penalty === 1 ? "one point is" : `${penalty} points are`;

export default function ProblemFAQ() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">
                    Additional Information on Problems
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Extra Information on The Problems</DialogTitle>
                    <DialogDescription>
                        Some additional information about these problems
                    </DialogDescription>
                    <div>
                        <Markdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeMathjax]}
                        >
                            {`**Scoring**

These problems are scored using rules similar to CS UIL. Every time you submit an incorrect solution, ${pointsOff} subtracted from the maximum ${DEFAULT_MAX_POINTS} pts you can get. You can run code without submitting to check for correctness.
Problems are considered "correct" when the Levenshtein distance of your output text and of the solution's output text are less than ${ACCEPTANCE_DISTANCE_THRESHOLD} (in other words, there are at most ${ACCEPTANCE_DISTANCE_THRESHOLD - 1} different deletions/insertions/substitutions required to create the correct output text).

**Problem Input**

One thing that differs from UIL and here is that **input is given via the command line**. This means that instead of reading the file \`problem.dat\`, you instead read from the \`System.in\`. The default code would be an example of how to get input for the problem.
`}
                        </Markdown>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="destructive">OK</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}
