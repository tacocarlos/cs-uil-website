// import { eq } from "drizzle-orm";
// import { db } from "~/server/db";
// import { problems } from "~/server/db/schema/problem";
// import Editor from "@monaco-editor/react";
// import JavaEditor, {
//   ResizableCodeEditor,
// } from "~/components/resources/problem/editor/editor";
// import type { Problem } from "~/server/db/schema/types";

// export default async function Page({
//   params,
// }: {
//   params: Promise<{ problemId: string }>;
// }) {
//   const { problemId } = await params;
//   const id = parseInt(problemId);
//   const problemArray = await db
//     .select()
//     .from(problems)
//     .where(eq(problems.id, id))
//     .limit(1);

//   if (problemArray.length == 0) {
//     return (
//       <section>
//         <p>Did not find problem.</p>
//       </section>
//     );
//   }

//   const problem = problemArray[0]!;
//   console.dir(problem);
//   return (
//     <>
//       <section className="bg-primary text-primary-foreground relative flex h-[45vh] items-center justify-center overflow-hidden">
//         <div>
//           <p>Some Text</p>
//           <p>Id: {problemId}</p>
//           <ResizableCodeEditor problem={problem} />
//         </div>
//       </section>
//     </>
//   );
// }

"use client";

import test from "node:test";
import { ResizableCodeEditor } from "~/components/resources/problem/editor/editor";
import type { Problem } from "~/server/db/schema/types";

// Mock function to simulate code execution
const runCode = async (code: string, input: string): Promise<string> => {
    // In a real application, this would send the code and input to a backend service
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simple mock that just echoes the input and code length
            resolve(
                `Executed code (${code.length} chars) with input:\n\n${input}\n\nThis is a simulated output.`,
            );
        }, 1000);
    });
};

export default function CodeEditorPage() {
    const initialCode = `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, UIL!");
    
    // Your solution here
  }
}`;

    const initialInput = `5
10
15`;

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="mb-4 text-2xl font-bold">UIL Problem Solver</h1>
            <p className="mb-6">
                Write, test, and debug your UIL competition solutions.
            </p>

            <ResizableCodeEditor
                problem={
                    {
                        id: 2,
                        problemName: "test",
                        problemText: "test",
                        enabled: true,
                    } as Problem
                }
                initialCode={initialCode}
                initialInput={initialInput}
                language="java"
                theme="vs-dark"
                onRun={runCode}
                fileName="Main.java"
            />
        </div>
    );
}
