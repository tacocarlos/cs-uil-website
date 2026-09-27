/**
 * Editor metadata for each language *family*, keyed by the part of a Judge0
 * language name before the version, e.g. "C (GCC 9.2.0)" → "C". Families
 * missing here still work, just with plain-text highlighting and no starter.
 *
 * Starter programs echo stdin line by line, so students see how to read input
 * and write output in that language. `monacoLang` must be a language Monaco
 * ships with; "plaintext" where it has none.
 */
export const LANGUAGE_FAMILIES: Record<
    string,
    { monacoLang: string; starterCode: string }
> = {
    Assembly: {
        monacoLang: "plaintext",
        starterCode: `section .bss
    buf resb 4096

section .text
    global _start

_start:
.loop:
    mov rax, 0          ; read(stdin, buf, 4096)
    mov rdi, 0
    mov rsi, buf
    mov rdx, 4096
    syscall
    cmp rax, 0
    jle .done
    mov rdx, rax        ; write(stdout, buf, bytes_read)
    mov rax, 1
    mov rdi, 1
    mov rsi, buf
    syscall
    jmp .loop
.done:
    mov rax, 60         ; exit(0)
    xor rdi, rdi
    syscall`,
    },
    Bash: {
        monacoLang: "shell",
        starterCode: `while IFS= read -r line || [[ -n "$line" ]]; do
    echo "$line"
done`,
    },
    Basic: {
        monacoLang: "vb",
        starterCode: `Dim As String s
Open Cons For Input As #1
Do Until EOF(1)
    Line Input #1, s
    Print s
Loop
Close #1`,
    },
    C: {
        monacoLang: "c",
        starterCode: `#include <stdio.h>

int main() {
    char line[1024];
    while (fgets(line, sizeof(line), stdin)) {
        printf("%s", line);
    }
    return 0;
}`,
    },
    "C++": {
        monacoLang: "cpp",
        starterCode: `#include <iostream>
#include <string>

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        std::cout << line << "\\n";
    }
    return 0;
}`,
    },
    "C#": {
        monacoLang: "csharp",
        starterCode: `using System;

class Program {
    static void Main() {
        string line;
        while ((line = Console.ReadLine()) != null) {
            Console.WriteLine(line);
        }
    }
}`,
    },
    Clojure: {
        monacoLang: "clojure",
        starterCode: `(doseq [line (line-seq (java.io.BufferedReader. *in*))]
  (println line))`,
    },
    COBOL: {
        monacoLang: "plaintext",
        starterCode: `       IDENTIFICATION DIVISION.
       PROGRAM-ID. MAIN.
       PROCEDURE DIVISION.
           DISPLAY "Hello, World!".
           STOP RUN.`,
    },
    "Common Lisp": {
        monacoLang: "plaintext",
        starterCode: `(loop for line = (read-line *standard-input* nil nil)
      while line
      do (write-line line))`,
    },
    D: {
        monacoLang: "plaintext",
        starterCode: `import std.stdio;

void main() {
    foreach (line; stdin.byLine) {
        writeln(line);
    }
}`,
    },
    Elixir: {
        monacoLang: "elixir",
        starterCode: `IO.stream(:stdio, :line)
|> Enum.each(&IO.write/1)`,
    },
    Erlang: {
        monacoLang: "plaintext",
        starterCode: `main(_) -> loop().

loop() ->
    case io:get_line("") of
        eof -> ok;
        Line -> io:put_chars(Line), loop()
    end.`,
    },
    "F#": {
        monacoLang: "fsharp",
        starterCode: `let rec loop () =
    match stdin.ReadLine() with
    | null -> ()
    | line ->
        printfn "%s" line
        loop ()

loop ()`,
    },
    Fortran: {
        monacoLang: "plaintext",
        starterCode: `program main
    implicit none
    character(len=1024) :: line
    integer :: ios

    do
        read(*, '(A)', iostat=ios) line
        if (ios /= 0) exit
        print '(A)', trim(line)
    end do
end program main`,
    },
    Go: {
        monacoLang: "go",
        starterCode: `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	scanner := bufio.NewScanner(os.Stdin)
	for scanner.Scan() {
		fmt.Println(scanner.Text())
	}
}`,
    },
    Groovy: {
        monacoLang: "plaintext",
        starterCode: `System.in.eachLine { line ->
    println line
}`,
    },
    Haskell: {
        monacoLang: "plaintext",
        starterCode: `main :: IO ()
main = interact id`,
    },
    Java: {
        monacoLang: "java",
        starterCode: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        Scanner sc = new Scanner(System.in);
        while (sc.hasNextLine()) {
            System.out.println(sc.nextLine());
        }
        sc.close();
    }
}`,
    },
    JavaScript: {
        monacoLang: "javascript",
        starterCode: `const readline = require("readline");

const rl = readline.createInterface({ input: process.stdin });
rl.on("line", (line) => {
    console.log(line);
});`,
    },
    Kotlin: {
        monacoLang: "kotlin",
        starterCode: `fun main() {
    while (true) {
        val line = readLine() ?: break
        println(line)
    }
}`,
    },
    Lua: {
        monacoLang: "lua",
        starterCode: `for line in io.lines() do
    print(line)
end`,
    },
    "Objective-C": {
        monacoLang: "objective-c",
        starterCode: `#include <stdio.h>

int main() {
    char line[1024];
    while (fgets(line, sizeof(line), stdin)) {
        printf("%s", line);
    }
    return 0;
}`,
    },
    OCaml: {
        monacoLang: "plaintext",
        starterCode: `let () =
  try
    while true do
      print_endline (input_line stdin)
    done
  with End_of_file -> ()`,
    },
    Octave: {
        monacoLang: "plaintext",
        starterCode: `while true
  line = fgetl(stdin);
  if ~ischar(line), break; end
  disp(line);
end`,
    },
    Pascal: {
        monacoLang: "pascal",
        starterCode: `program Main;
var
  line: string;
begin
  while not eof do
  begin
    readln(line);
    writeln(line);
  end;
end.`,
    },
    Perl: {
        monacoLang: "perl",
        starterCode: `while (my $line = <STDIN>) {
    print $line;
}`,
    },
    PHP: {
        monacoLang: "php",
        starterCode: `<?php
while (($line = fgets(STDIN)) !== false) {
    echo $line;
}`,
    },
    Prolog: {
        monacoLang: "plaintext",
        starterCode: `:- initialization(main).

main :- get_char(C), echo(C), halt.

echo(end_of_file) :- !.
echo(C) :- put_char(C), get_char(Next), echo(Next).`,
    },
    // Works on both Python 2 and 3.
    Python: {
        monacoLang: "python",
        starterCode: `import sys

for line in sys.stdin:
    sys.stdout.write(line)`,
    },
    R: {
        monacoLang: "r",
        starterCode: `con <- file("stdin")
lines <- readLines(con)
close(con)

for (line in lines) {
  cat(line, "\\n", sep = "")
}`,
    },
    Ruby: {
        monacoLang: "ruby",
        starterCode: `STDIN.each_line do |line|
  print line
end`,
    },
    Rust: {
        monacoLang: "rust",
        starterCode: `use std::io::{self, BufRead};

fn main() {
    let stdin = io::stdin();
    for line in stdin.lock().lines() {
        println!("{}", line.unwrap());
    }
}`,
    },
    Scala: {
        monacoLang: "scala",
        starterCode: `object Main {
  def main(args: Array[String]): Unit = {
    for (line <- scala.io.Source.stdin.getLines()) {
      println(line)
    }
  }
}`,
    },
    SQL: {
        monacoLang: "sql",
        starterCode: `SELECT 'Hello, World!';`,
    },
    Swift: {
        monacoLang: "swift",
        starterCode: `while let line = readLine() {
    print(line)
}`,
    },
    TypeScript: {
        monacoLang: "typescript",
        // Judge0 compiles without Node's type definitions, so `require`
        // must be declared.
        starterCode: `declare const require: any;

const input: string = require("fs").readFileSync(0, "utf8");
const lines = input.split("\\n");
if (lines[lines.length - 1] === "") lines.pop();

for (const line of lines) {
    console.log(line);
}`,
    },
    "Visual Basic.Net": {
        monacoLang: "vb",
        starterCode: `Imports System

Module Program
    Sub Main()
        Dim line As String = Console.ReadLine()
        Do While line IsNot Nothing
            Console.WriteLine(line)
            line = Console.ReadLine()
        Loop
    End Sub
End Module`,
    },
};
