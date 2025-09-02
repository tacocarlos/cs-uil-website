import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { problems } from "~/server/db/schema/problem";
import Editor from "@monaco-editor/react";
import JavaEditor, {
  ResizableCodeEditor,
} from "~/components/resources/problem/editor/editor";
import type { Problem } from "~/server/db/schema/types";

export default async function Page({
  params,
}: {
  params: Promise<{ problemId: string }>;
}) {
  const { problemId } = await params;
  const id = parseInt(problemId);
  const problemArray = await db
    .select()
    .from(problems)
    .where(eq(problems.id, id))
    .limit(1);

  if (problemArray.length == 0) {
    return (
      <section>
        <p>Did not find problem.</p>
      </section>
    );
  }

  const problem = problemArray[0]!;
  console.dir(problem);
  return (
    <>
      <section className="bg-primary text-primary-foreground relative flex h-[45vh] items-center justify-center overflow-hidden">
        <div>
          <p>Some Text</p>
          <p>Id: {problemId}</p>
          <ResizableCodeEditor problem={problem} />
        </div>
      </section>
    </>
  );
}
