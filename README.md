# DryRun — Computer Science Reasoning Lab

A reasoning workbench for Cambridge Computer Science (IGCSE 0478 and AS & A Level 9618). One self-contained HTML file: no framework, no build step, no dependencies, no network calls. It works offline and nothing you type leaves your browser.

**Live:** https://cie-cs-toolkit.vercel.app　·　[run the self-test](https://cie-cs-toolkit.vercel.app/?selftest=1)

> **Independent learning resource — not endorsed by Cambridge International Education.**
> Cambridge International Education is not affiliated with this project. The syllabus codes are used only to say which courses this is aimed at. Every question is original, written against publicly listed syllabus content; no past-paper material is reproduced.

## The idea

The same algorithm can be looked at as structured English, as pseudocode, as a trace table, as a flowchart or as a logic circuit. Understanding usually breaks when you move between two of them. DryRun lets you move an algorithm across all five and see exactly where the versions stop agreeing — and then marks your work in a way that can tell understanding from pattern-matching.

## Marking you can trust

A question that asks for a program is graded by **running it against hidden test cases**, never by comparing one visible output.

An earlier version compared a single output, so this passed "output the larger of two numbers":

```
OUTPUT 58
```

It no longer does. Every code question:

- reads its values with `INPUT`, so there is something to vary;
- carries hidden cases tagged **core** and **edge**, plus seeded random ones;
- states the constructs it requires, checked on the **syntax tree** rather than by searching the text;
- computes expected answers from its own reference solution, so stored answers cannot drift;
- returns a mark breakdown and says what kind of wrong it is: syntax error, run-time error, missing construct, incorrect logic, incomplete, or correct.

A failing hidden case is described in words ("when given two equal numbers") without handing over its inputs.

## What is in it

| Area | What it does |
|---|---|
| **Practice** | 36 original questions plus generated ones, marked against hidden cases. Run executes your program and awards nothing; Check answer marks it and records an attempt. Show answer stays locked until two attempts. |
| **Pseudocode Lab** | Trace simulator, Structured English → pseudocode, trace table → pseudocode, and flowchart → pseudocode + trace table + drawn chart. |
| **Logic Lab** | Truth tables with a column per intermediate step, and the circuit drawn with textbook gate symbols. |
| **Progress** | Evidence per topic, the review queue, every attempt, and a page explaining exactly how each state is worked out. |
| **Evidence** | Diagnostic scores, learning gain, retention, feedback, and an anonymised export. |

## Progress is evidence, not a percentage

| State | When |
|---|---|
| **UNSCOUTED** | Fewer than two attempts. Shown instead of 0%, which would read as "you got everything wrong". |
| **DEVELOPING** | Attempted, but not yet three attempts with two different questions fully right. |
| **SECURE** | At least three attempts, two different questions fully right, and the most recent attempt correct. |
| **REVIEW DUE** | Something wrong here has come round again on the spacing schedule: 1, 3, 7, 16 then 35 days. |

Failed questions enter the review queue by themselves. Nothing has to be re-entered by hand, and no number appears unless something produced it.

## Syllabus versions

The syllabuses change, and the changes matter, so a qualification is always stored with its version and exam years:

- Cambridge IGCSE 0478 — 2026–2028
- Cambridge IGCSE 0478 — 2029 *(assesses Python 3, not pseudocode — the app says so)*
- Cambridge International AS & A Level 9618 — 2026
- Cambridge International AS & A Level 9618 — 2027–2029
- 9608 is kept so older notes still make sense, marked as withdrawn, and is never offered as a current choice.

## Supported pseudocode

| Category | Content |
|---|---|
| Declaration | `DECLARE x : INTEGER/REAL/BOOLEAN/CHAR/STRING`, `DECLARE a : ARRAY[1:10] OF INTEGER`, `DECLARE g : ARRAY[1:3, 1:4] OF INTEGER`, `CONSTANT` |
| Operators | `+ - * / MOD DIV &`, comparison `= <> < > <= >=`, logic `AND OR NOT` |
| Selection | `IF … THEN … ELSE … ENDIF`, `CASE OF … OTHERWISE … ENDCASE` |
| Loops | `FOR … TO … STEP … NEXT/ENDFOR`, `WHILE … DO … ENDWHILE`, `REPEAT … UNTIL` |
| Routines | `PROCEDURE … ENDPROCEDURE` with `CALL`, `FUNCTION … RETURNS … RETURN … ENDFUNCTION`, `BYVALUE` and `BYREF` parameters, recursion |
| Files | `OPENFILE … FOR READ/WRITE/APPEND`, `READFILE`, `WRITEFILE`, `CLOSEFILE`, `EOF` — simulated in memory for one run |
| Input / output | `OUTPUT` (comma-joined), `INPUT` |
| Functions | `LENGTH MID LEFT RIGHT UCASE LCASE INT ROUND` |

Limits that always hold: 3000 execution steps, 500 output lines, recursion depth 120, 20000 array elements, 2000 file lines. File names are stripped to a safe character set, so nothing can address anything outside the sandbox. There is no `eval()` anywhere.

## Question bank

36 original questions across nine syllabus topics, from one-decision foundation questions to recursion, two-dimensional arrays and file handling. Each one carries tagged hidden cases, required constructs, two or more hints, and an explanation of the idea it is really testing.

Three tests hold the bank to account, so it cannot rot as it grows: every reference solution must score full marks on its own question, every question must resist a hard-coded visible answer, and every question must be complete — original, with a real prompt, an edge case, a description for every hidden case, and marking rules that add up to the marks it advertises. That last check caught two questions whose stated total disagreed with their own rubric.

## Built-in self-test

110 assertions covering the interpreter, the CIE-specific errors, both pseudocode converters, flowchart drawing, truth tables, hidden-case grading, the syllabus registry, the storage layer and its migrations, accessibility and the metadata. The contrast check reads the live custom properties, so the stylesheet itself is what gets tested.

Add `?selftest=1` to the URL, or run it from the command line:

```bash
node -e 'const fs=require("fs"),os=require("os"),p=require("path");
const s=fs.readFileSync("index.html","utf8").match(/<script>([\s\S]*?)<\/script>/)[1];
const f=p.join(os.tmpdir(),"core.js");fs.writeFileSync(f,s);
const r=require(f).runSelfTest();
r.forEach(x=>console.log((x.ok?"PASS ":"FAIL ")+x.name));
console.log(r.filter(x=>x.ok).length+"/"+r.length);'
```

Two tests are browser-only (contrast and the DOM checks) and pass trivially under Node, where there is no document.

## Running and deploying

Open `index.html` in a browser. That is the whole build.

Deploy: push to GitHub, import the repo at vercel.com with Framework Preset **Other** and both Build Command and Output Directory left empty. Later pushes to `main` redeploy automatically.

## Note

A revision aid for use outside the exam hall — not for use in a real examination.
