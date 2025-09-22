import { readFileSync } from "fs";
import { join, dirname, basename } from "path";

export default function ReadInputOutputFromFile(javaCodePath: string) {
    const problemName = basename(javaCodePath, ".java").toLowerCase();
    const dir = dirname(javaCodePath);
    const inputPath = join(dir, `${problemName}.dat`);
    const outputPath = join(dir, `${problemName}.out`);

    const code = readFileSync(javaCodePath, { encoding: "utf-8" });
    const input = readFileSync(inputPath, { encoding: "utf-8" });
    const output = readFileSync(outputPath, { encoding: "utf-8" });

    return {
        correctCode: code,
        testInput: input,
        testOutput: output,
    };
}
