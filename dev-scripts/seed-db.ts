// import { db } from "~/server/db";
// import { readFileSync } from "fs";
// import { type Problem } from "~/server/db/schema/types";
// import { problems } from "~/server/db/schema/problem";

// const data: Omit<Problem, "id">[] = [
//     {
//         problemName: "Bipul",
//         competitionYear: 2019,
//         competitionLevel: "district",
//         problemText: readFileSync(
//             "dev-scripts/problems/uil/2019/district/Bipul.md",
//             { encoding: "utf-8" },
//         ),
//         programName: "Bipul.java",
//         inputFileName: null,
//         defaultInputFile: null,
//         enabled: true,
//         testOutput: "",
//         testInput: "",
//     },
//     {
//         problemName: "Luna",
//         competitionYear: 2025,
//         competitionLevel: "custom",
//         problemText: readFileSync(
//             "dev-scripts/problems/uil/2025/custom/Luna.md",
//             { encoding: "utf-8" },
//         ),
//         programName: "Luna.java",
//         inputFileName: "luna.dat",
//         defaultInputFile: readFileSync(
//             "dev-scripts/problems/uil/2025/custom/luna.dat",
//             { encoding: "utf-8" },
//         ),
//         enabled: true,
//         testOutput: "sans undertale",
//         testInput: readFileSync(
//             "dev-scripts/problems/uil/2025/custom/luna.dat",
//             { encoding: "utf-8" },
//         ),
//     },
// ];

// data.forEach((p) => {
//     void db
//         .insert(problems)
//         .values(p)
//         .then(() => {
//             console.log("Inserted new problem");
//             console.dir(p);
//         });
// });
