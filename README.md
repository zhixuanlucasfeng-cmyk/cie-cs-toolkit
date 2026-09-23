# DryRun — Computer Science Reasoning Lab

A reasoning workbench for Cambridge Computer Science (IGCSE 0478 and AS & A Level 9618). One self-contained HTML file: no framework, no build step, no dependencies. It works offline, and signed out it makes no network request after loading — nothing you type leaves your browser.

Signing in is **optional and switched off by default**; it unlocks no feature and only copies your own progress between your own devices. See [docs/sync-setup.md](docs/sync-setup.md).

**Live:** https://dryruncs.com　·　[run the self-test](https://dryruncs.com/?selftest=1)

The original address, `cie-cs-toolkit.vercel.app`, still works and redirects here, so links already shared with students and teachers keep working.

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
| **Write a question** | Students author their own questions, with their own test cases. The marking is derived by running the author's solution, so a question that does not work cannot be shared — and one whose answer never changes is refused, because printing it would beat understanding it. Questions travel as files, so this needs no server and no account. Shared questions are marked but never counted as evidence. |
| **Pseudocode IDE** | A full editor for CIE pseudocode: syntax highlighting, problems reported as you type, auto-indent that closes blocks for you, click-a-line-number breakpoints, step and continue, with output, variables and a trace table beside it. Your program is saved in the browser as you type. |
| **Practice** | 36 original questions plus generated ones, marked against hidden cases. Run executes your program and awards nothing; Check answer marks it and records an attempt. Show answer stays locked until two attempts. |
| **Pseudocode Lab** | Build a standard flowchart step by step and turn it into Structured English, Cambridge pseudocode and a runnable trace table; also convert Structured English, trace tables and typed flowchart steps into pseudocode. |
| **Logic Lab** | Truth tables with a column per intermediate step, and the circuit drawn with textbook gate symbols. |
| **Progress** | Evidence per topic, the review queue, every attempt, and a page explaining exactly how each state is worked out. |
| **Sync** *(off by default)* | Optional email sign-in — a link, no password — that copies your progress between devices. Merged, not overwritten: attempts made on either device survive. Deleting the account removes the stored copy and the address; the copy in your browser stays. |
| **Evidence** | Diagnostic scores, learning gain, retention, feedback, and an anonymised export. |

## One record per course

A profile is `qualification | syllabus version | exam year | level`, and every attempt, review item, diagnostic and session belongs to exactly one. Switching between IGCSE and A Level — or between AS 2026 and A Level 2028, which share topic codes — never mixes the two, and an attempt is never relabelled as belonging to a course it was not earned on. Export and import keep that ownership.

Stored under `dryrun.store.v3`. Data written by an earlier version is migrated under the profile that was active when it was written; if there was none, it is kept aside rather than erased or attributed to a course at random.

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

## Telling you what you got wrong, not just that you did

A mark out of six tells a student very little. When a submission fails, DryRun tries to name the *kind* of mistake — and it does so from what the program actually did on the hidden cases, never from reading the source and never from a guess.

| What the evidence shows | What it is told |
|---|---|
| Right in the middle of every range, wrong at the edges | A boundary is in the wrong place — check `<` against `<=` |
| Every case with a negative number fails, the rest pass | Negative values are not handled — often a total or maximum started at 0 |
| Only the cases involving zero fail | Zero is not handled — what does your loop do when the value is 0? |
| Every case prints exactly one line more or fewer | The loop runs one time too many or too few |
| Output is the expected answer backwards | Right values, wrong order — check the direction of the loop |
| The output never changes, whatever the input | The program ignores what it reads |
| Only the worked example passes | It works for the example and nothing else |

If the evidence fits none of these, nothing is claimed. Correct answers are never given a diagnosis — a test checks that across every question in the bank.

The named slips are counted across attempts, so the Evidence page can show which mistake keeps coming back rather than treating each one as a one-off, and the review queue says "A boundary is in the wrong place" instead of a tag.

## Question bank

36 original questions across nine syllabus topics, from one-decision foundation questions to recursion, two-dimensional arrays and file handling. Each one carries tagged hidden cases, required constructs, two or more hints, and an explanation of the idea it is really testing.

Three tests hold the bank to account, so it cannot rot as it grows: every reference solution must score full marks on its own question, every question must resist a hard-coded visible answer, and every question must be complete — original, with a real prompt, an edge case, a description for every hidden case, and marking rules that add up to the marks it advertises. That last check caught two questions whose stated total disagreed with their own rubric.

## Built-in self-test

The built-in self-test covers the interpreter, the CIE-specific errors, both pseudocode converters, guided flowchart editing and drawing, truth tables, hidden-case grading, the syllabus registry, the storage layer and its migrations, accessibility and the metadata. The contrast check reads the live custom properties, so the stylesheet itself is what gets tested.

Add `?selftest=1` to the URL, or run the complete verification suite locally:

```bash
npm ci
npx playwright install chromium
npm test
```

`npm run test:core` runs the portable interpreter and data checks. `npm run test:browser` loads both the self-test route and the ordinary application in Chromium. The browser run is required because contrast, accessibility and interaction checks need a real document and initialized event handlers.

## Running and deploying

Open `index.html` in a browser. That is the whole production build; the npm packages are development-only test tools and are not shipped to students.

Deploy: push to GitHub, import the repo at vercel.com with Framework Preset **Other** and both Build Command and Output Directory left empty. Later pushes to `main` redeploy automatically.

## Note

A revision aid for use outside the exam hall — not for use in a real examination.
