import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeMathjax from "rehype-mathjax";
import type { Problem } from "~/server/db/schema/types";

export default function ProblemStatement({ problem }: { problem: Problem }) {
    return (
        <div className="">
            <Markdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeMathjax]}
            >
                {`## ${problem.problemName}
${problem.problemText}

---

## Example Input
\`\`\`
${problem.defaultInputFile != "" && problem.defaultInputFile != null ? problem.defaultInputFile : "No Input Given For This Problem"}
\`\`\`

---

## Example Output
\`\`\`
${problem.sampleOutput}
\`\`\`
`}
            </Markdown>
        </div>
    );
}
