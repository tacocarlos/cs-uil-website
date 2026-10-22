/**
 * Fixtures mirror the live api.lunaghs.dev response shapes. If the API
 * changes shape, update the fixtures and these wrappers together.
 */
import { afterEach, describe, expect, test } from "vitest";
import { type ApiProblem, getProblemById } from "./lunaghs";

const problem: ApiProblem = {
    id: 1,
    competition: 1,
    createdAt: "2026-04-15T19:30:52.442Z",
    updatedAt: "2026-10-13T01:27:58.315Z",
    name: "Abby",
    number: 1,
    problem_text_url: "https://example.com/abby.md",
    student_data_url: null,
    student_output_url: "https://example.com/abby.out",
    test_data_url: null,
    test_output_url: "https://example.com/abby-test.out",
    solution: "public class Abby {}",
};

const realFetch = globalThis.fetch;

function stubFetch(respond: () => Response | Promise<Response>) {
    globalThis.fetch = (async () => respond()) as unknown as typeof fetch;
}

afterEach(() => {
    globalThis.fetch = realFetch;
});

describe("getProblemById", () => {
    test("unwraps the { success, problem } envelope", async () => {
        stubFetch(() => Response.json({ success: true, problem }));

        const result = await getProblemById(1);

        expect(result).toEqual(problem);
        // The past-problem page joins on this field to find the competition.
        expect(result?.competition).toBe(1);
    });

    test("returns null when the envelope has no problem", async () => {
        stubFetch(() => Response.json({ success: false, problem: null }));
        expect(await getProblemById(1)).toBeNull();
    });

    test("returns null on a non-OK response", async () => {
        stubFetch(() => new Response("Not found", { status: 404 }));
        expect(await getProblemById(999)).toBeNull();
    });

    test("returns null when the request fails", async () => {
        stubFetch(() => {
            throw new Error("network down");
        });
        expect(await getProblemById(1)).toBeNull();
    });
});
