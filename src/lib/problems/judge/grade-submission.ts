import { distance } from "fastest-levenshtein";
import { fetchUrlContent, getProblemById } from "~/lib/api/lunaghs";
import { runOnJudge0 } from "~/lib/problems/execute/judge0";
import { isJudge0Failure } from "~/lib/problems/execute/judge0-result";
import { ACCEPTANCE_DISTANCE_THRESHOLD } from "~/lib/problems/scoring";

/**
 * Runs `code` against a problem's hidden test data and compares its output to
 * the expected output. Does not touch the database; callers decide how to
 * score and persist the result.
 */
export async function gradeSubmission(
    apiProblemId: number,
    code: string,
    languageId: string,
) {
    const problem = await getProblemById(apiProblemId);
    if (!problem) {
        throw new Error(`Failed to fetch problem ${apiProblemId} from API`);
    }

    const [testInput, testOutput] = await Promise.all([
        fetchUrlContent(problem.testDataUrl),
        fetchUrlContent(problem.testOutputUrl),
    ]);
    const expected = testOutput.replaceAll("\r", "");

    const result = await runOnJudge0(code, languageId, testInput);
    // Throw rather than grade, so a judge outage isn't recorded as a wrong
    // attempt (which would cost the student points).
    if (isJudge0Failure(result)) {
        throw new Error(
            `Judge0 failed to run the submission: ${result.status.description}` +
                (result.message ? ` (${result.message})` : ""),
        );
    }
    const actual = result.stdout ?? "";
    const dist = distance(actual, expected);

    return {
        accepted: dist < ACCEPTANCE_DISTANCE_THRESHOLD,
        distance: dist,
        actual,
        expected,
        result,
        problem,
    };
}
