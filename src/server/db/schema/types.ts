/**
 * Standalone Problem type – mirrors the shape previously inferred from the
 * Drizzle schema so that all existing UI components continue to compile
 * without modification, while allowing the data to be sourced from the
 * external API instead of the database.
 */
export interface Problem {
    id: number;
    problemName: string;
    competitionYear: number;
    competitionLevel:
        | "invA"
        | "invB"
        | "district"
        | "region"
        | "state"
        | "custom";
    problemText: string;
    programName: string;
    sampleOutput: string;
    inputFileName: string | null;
    defaultInputFile: string | null;
    enabled: boolean;
    solutionCode: string;
    testInput: string;
    testOutput: string;
}
