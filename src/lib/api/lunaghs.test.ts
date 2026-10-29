/**
 * Fixtures mirror the live api.lunaghs.dev response shapes (snake_case
 * JSON, which the SDK parses). If the API changes shape, update the
 * fixtures alongside the SDK.
 */
import { afterEach, describe, expect, test } from "vitest";
import { CompetitionLevelEnum } from "@tacocarlos/luna-cs-uil";
import { competitionLevel, getProblemById, LUNAGHS_CACHE_TAG } from "./lunaghs";

const problemJson = {
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
let requests: { url: string; init?: RequestInit }[] = [];

function stubFetch(respond: () => Response | Promise<Response>) {
    requests = [];
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
        requests.push({ url, init });
        return respond();
    }) as unknown as typeof fetch;
}

afterEach(() => {
    globalThis.fetch = realFetch;
});

describe("getProblemById", () => {
    test("parses the problem", async () => {
        stubFetch(() => Response.json(problemJson));

        const result = await getProblemById(1);

        expect(requests[0]?.url).toBe("https://api.lunaghs.dev/api/problems/1");
        expect(result).toMatchObject({
            id: 1,
            name: "Abby",
            // The past-problem page looks the competition up by this field.
            competition: 1,
            studentDataUrl: null,
            testOutputUrl: "https://example.com/abby-test.out",
            createdAt: new Date("2026-04-15T19:30:52.442Z"),
        });
    });

    test("caches the request with Next.js", async () => {
        stubFetch(() => Response.json(problemJson));
        await getProblemById(1);
        expect(requests[0]?.init?.next?.revalidate).toBe(3600);
        // The teacher dashboard's Refresh Problem Data button revalidates
        // this tag.
        expect(requests[0]?.init?.next?.tags).toContain(LUNAGHS_CACHE_TAG);
    });

    test("returns null on a 404", async () => {
        stubFetch(() =>
            Response.json(
                { message: "Problem 999 not found" },
                { status: 404 },
            ),
        );
        expect(await getProblemById(999)).toBeNull();
    });

    test("returns null when the request fails", async () => {
        stubFetch(() => {
            throw new Error("network down");
        });
        expect(await getProblemById(1)).toBeNull();
    });
});

describe("competitionLevel", () => {
    const competition = {
        id: 1,
        createdAt: null,
        updatedAt: null,
        year: 2026,
        studentPacketUrl: "",
        dataZipUrl: "",
    };

    test("is the competition's level", () => {
        expect(
            competitionLevel({
                ...competition,
                level: CompetitionLevelEnum.District,
            }),
        ).toBe("district");
    });

    test("counts competitions without a level as custom", () => {
        expect(competitionLevel({ ...competition, level: null })).toBe(
            "custom",
        );
    });
});
