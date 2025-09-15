import { env } from "~/env";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const executeRouter = createTRPCRouter({
    getJavaRuntimes: publicProcedure.query(async () => {
        type ResponseData = [{ name: string; id: string }];
        const url = new URL("/languages", env.JUDGE_URL as string);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const languages: ResponseData = (await response.json()) as ResponseData;
        const javaJREs = languages.filter((l) => {
            if (l.name.includes("OpenJDK")) {
                return true;
            }

            return false;
        });

        return javaJREs;
    }),

    runCode: publicProcedure
        .input(
            z.object({
                code: z.string(),
                input: z.string(),
                languageId: z.string(),
            }),
        )
        .output(
            z.object({
                stdout: z.string().nullable(),
                stderr: z.string().nullable(),
                time: z.string(),
                memory: z.number(),
                token: z.string(),
                compile_output: z.string().nullable(),
                status: z.object({
                    id: z.number(),
                    description: z.string(),
                }),
            }),
        )
        .mutation(async (opts) => {
            const { code, input, languageId } = opts.input;
            const subReqBody = JSON.stringify({
                source_code: code,
                language_id: languageId,
                stdin: input,
            });
            console.dir(subReqBody);
            const submissionRequestResult = await fetch(
                "http://judge0.lunaghs.dev/submissions?wait=true",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        source_code: code,
                        language_id: languageId,
                        stdin: input,
                    }),
                },
            );
            console.log("GETTING TOKEN");
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const submissionRequestBody = await submissionRequestResult.json();
            console.log("GOT TOKEN");
            console.dir(submissionRequestBody);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/dot-notation, @typescript-eslint/no-unsafe-member-access
            const submissionToken = submissionRequestBody.token;
            console.log("GOT TOKEN [REAL]");
            const submissionResultRequest = await fetch(
                `http://judge0.lunaghs.dev/submissions/${submissionToken}`,
                {
                    method: "GET",
                },
            );

            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return submissionResultRequest.json();
        }),
});
export type AppRouter = typeof executeRouter;
