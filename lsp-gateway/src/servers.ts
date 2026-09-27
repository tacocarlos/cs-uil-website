/**
 * Language servers this gateway can start, by the ID in the URL
 * (`/lsp/<id>`). Must match LSP_SERVER_IDS in the website's
 * `src/lib/lsp/servers.ts`.
 *
 * Each session gets a directory with a `project/` folder (the workspace the
 * editor's files live in) and room beside it for server state. In commands,
 * `{project}` is replaced with the project folder and `{session}` with the
 * session directory. Override any command with `LSP_COMMAND_<ID>`
 * (space-separated), e.g. `LSP_COMMAND_JAVA="jdtls -data {session}/jdtls"`.
 *
 * Language levels are pinned to what Judge0 compiles with, so students
 * aren't offered features Judge0 would reject: Java 13, Python 3.8, and
 * GCC 9.2's default C/C++ standards.
 */
const DEFAULT_COMMANDS: Record<string, string[]> = {
    // jdtls keeps its index in -data: one per session so sessions don't
    // collide, and outside the project so it isn't scanned as source.
    java: ["jdtls", "-data", "{session}/jdtls-data"],
    python: ["pyright-langserver", "--stdio"],
    // Serves both C and C++; the document's languageId tells them apart.
    clangd: ["clangd", "--log=error"],
};

/**
 * Files written into `project/` before the server starts, so it treats the
 * folder as a project from the beginning.
 */
const PROJECT_FILES: Record<string, Record<string, string>> = {
    // Without an Eclipse project, jdtls treats Main.java as a loose file and
    // reports only syntax errors. The project root is the source folder.
    java: {
        ".project": `<?xml version="1.0" encoding="UTF-8"?>
<projectDescription>
    <name>workspace</name>
    <buildSpec>
        <buildCommand><name>org.eclipse.jdt.core.javabuilder</name></buildCommand>
    </buildSpec>
    <natures><nature>org.eclipse.jdt.core.javanature</nature></natures>
</projectDescription>
`,
        ".classpath": `<?xml version="1.0" encoding="UTF-8"?>
<classpath>
    <classpathentry kind="src" path="" excluding="bin/"/>
    <classpathentry kind="con" path="org.eclipse.jdt.launching.JRE_CONTAINER"/>
    <classpathentry kind="output" path="bin"/>
</classpath>
`,
        ".settings/org.eclipse.jdt.core.prefs": `eclipse.preferences.version=1
org.eclipse.jdt.core.compiler.codegen.targetPlatform=13
org.eclipse.jdt.core.compiler.compliance=13
org.eclipse.jdt.core.compiler.source=13
`,
    },
    python: {
        "pyrightconfig.json": `${JSON.stringify({ pythonVersion: "3.8" })}\n`,
    },
    // GCC's defaults: gnu11 for C, gnu++14 for C++.
    clangd: {
        ".clangd": `If:
  PathMatch: .*\\.c
CompileFlags:
  Add: [-std=gnu11]
---
If:
  PathMatch: .*\\.cpp
CompileFlags:
  Add: [-std=gnu++14]
`,
    },
};

export const SERVER_IDS = Object.keys(DEFAULT_COMMANDS);

export function serverCommand(
    id: string,
    dirs: { session: string; project: string },
): string[] | undefined {
    const override = process.env[`LSP_COMMAND_${id.toUpperCase()}`];
    const command = override
        ? override.split(" ").filter(Boolean)
        : DEFAULT_COMMANDS[id];
    return command?.map((part) =>
        part
            .replaceAll("{session}", dirs.session)
            .replaceAll("{project}", dirs.project),
    );
}

export function projectFiles(id: string): Record<string, string> {
    return PROJECT_FILES[id] ?? {};
}
