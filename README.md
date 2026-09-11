# CIE CS Revision Toolkit

Five revision tools for Cambridge Computer Science (9618 / 9608 / 0478) candidates: a single file, pure front-end, zero dependencies, works offline.

**Online:** https://cie-cs-toolkit.vercel.app　·　[run the self-test](https://cie-cs-toolkit.vercel.app/?selftest=1)

## The five modules

### 1. Pseudocode trace table simulator

Executes CIE pseudocode line by line and builds the trace table automatically — every executed line records the current value of every variable plus any output.

- 9 built-in exam-style programs (bubble sort, linear search, sum with a sentinel value, denary to binary, string reversal and more); pick one from the dropdown and step straight through it
- Step / auto-play / reset, with the current line highlighted in the editor
- Changed values are colour-marked in the table, so you can see at a glance what each line altered
- One click copies the table as TSV, ready to paste into Word or Excel
- Errors are reported the CIE way, not as a bare "SyntaxError":
  - using a variable without `DECLARE`
  - using `=` as the assignment operator (it should be `←`)
  - indexing an array at 0 (CIE arrays start at 1)
  - a missing `ENDIF` / `ENDFOR` / `ENDWHILE`, naming the line whose statement was left unclosed
  - infinite-loop protection (aborts after 3000 steps)

**Supported syntax**

| Category | Content |
|---|---|
| Declaration | `DECLARE x : INTEGER/REAL/BOOLEAN/CHAR/STRING`, `DECLARE a : ARRAY[1:10] OF INTEGER`, `CONSTANT` |
| Operators | `+ - * / MOD DIV &`, comparison `= <> < > <= >=`, logic `AND OR NOT` |
| Selection | `IF … THEN … ELSE … ENDIF` (`THEN` may be omitted), `CASE OF … OTHERWISE … ENDCASE` |
| Loops | `FOR … TO … STEP … NEXT/ENDFOR`, `WHILE … DO … ENDWHILE`, `REPEAT … UNTIL` |
| Input / output | `OUTPUT` (comma-joined), `INPUT` (takes values from the input queue in order) |
| Functions | `LENGTH MID LEFT RIGHT UCASE LCASE INT ROUND` |

User-defined `PROCEDURE` / `FUNCTION`, recursion, 2-D arrays and file handling are not supported — they hardly ever appear in trace table questions, and leaving them out keeps everything that *is* supported correct.

### 2. Logic gate and truth table generator

Enter a boolean expression to get a full truth table **including the intermediate steps**, plus the matching logic gate circuit diagram.

- Operators: `AND OR NOT XOR NAND NOR` + brackets
- Precedence: `( )` > `NOT` > `AND`/`NAND` > `XOR` > `OR`/`NOR`
- The truth table does not just give the final answer — every intermediate operation gets its own column. For example `(A XOR B) AND NOT C` expands to
  `A | B | C | A XOR B | NOT C | (A XOR B) AND NOT C`
- The circuit is hand-drawn SVG using the standard gate symbols (the D-shape for AND, the curved shield for OR, the triangle-and-bubble for NOT, the double curve for XOR), so it looks like the textbook and the exam paper — not labelled rectangles
- Identical sub-expressions share the same gate, exactly as in a real circuit

### 3. Structured English → pseudocode

Type the algorithm the way it is worded in a question and get CIE pseudocode back — plus **the full trace table of the generated program**, not just its final answer. A "Send to trace simulator" button drops the result into module 1 for stepping through.

- Indentation decides what sits inside a loop or an `If`; explicit `End if` / `End while` / `Next x` also work
- Understood sentence forms: `Set X to …`, `Add … to X`, `Subtract … from X`, `Multiply X by …`, `Increase/Decrease X by …`, `Input …`, `Output …`, `If … then` / `Otherwise` / `End if`, `Repeat` / `Until …`, `While … do` / `End while`, `For each X from A to B` / `Next X`
- Wording is translated to symbols: `is greater than or equal to` → `>=`, `is not equal to` → `<>`, `plus` → `+`, `divided by` → `/`
- `DECLARE` lines are worked out from the first value each variable receives
- A sentence outside the list is reported by line number with the accepted forms listed — it is never guessed at

### 4. Trace table → pseudocode

The reverse direction: fill in a trace table by hand and get the program that would produce it.

- Name the variable columns, then fill `Line | values | OUTPUT` row by row; a blank cell means "unchanged"
- Repeated line numbers are detected as a loop, and a variable stepping by a fixed amount becomes the `FOR` control variable
- Right-hand sides are inferred from a fixed candidate list (`X + k`, `X + Y`, `X * Y`, `Y`, literal…) and must hold on *every* pass of the loop
- **Self-verification:** the generated pseudocode is run back through the interpreter and compared with your table — ✓ when it reproduces it, otherwise it names exactly which variable disagrees and where
- No `IF` conditions are invented: a table containing a branch comes back as straight-line code

### 5. Flowchart → pseudocode, trace table and a drawn chart

Type a flowchart one box per line — each box written either as CIE pseudocode or as the structured English of module 3 — and get three things at once:

- the **flowchart drawn properly in SVG**: stadium terminators, rectangles for processes, parallelograms for input/output, diamonds with `Yes` / `No` branches, loops returning up their own lane
- the **CIE pseudocode**
- the **full trace table** of that program running (with a box for the `INPUT` values)

`START` and `STOP` lines are optional decoration, indentation says what sits inside a loop or a decision, and `FOR` loops are drawn the way the textbook does it: an initial box, a test diamond, the body, and an increment box on the way back round. `CASE OF` is refused with a note to rewrite it as `IF … ELSE`, rather than drawn wrongly.

## Built-in self-test

Correctness is covered by 40 assertions (interpreter semantics, the CIE-specific errors, truth tables, operator precedence, NAND/NOR, the English sentence forms, flowchart drawing and escaping, and a round trip that turns each built-in example into a trace table and back into a program).

Add `?selftest=1` to the URL to run them:

```
index.html?selftest=1
```

Or from the command line:

```bash
node -e 'const fs=require("fs"),os=require("os"),p=require("path");
const s=fs.readFileSync("index.html","utf8").match(/<script>([\s\S]*?)<\/script>/)[1];
const f=p.join(os.tmpdir(),"core.js");fs.writeFileSync(f,s);
const r=require(f).runSelfTest();
r.forEach(x=>console.log((x.ok?"PASS ":"FAIL ")+x.name));
console.log(r.filter(x=>x.ok).length+"/"+r.length);'
```

## Running locally

Just open `index.html` in a browser. No build step, no dependencies, no network needed.

## Deploying to Vercel

1. Push the repo to GitHub
2. vercel.com → Add New → Project → Import this repo
3. Framework Preset **Other**; leave Build Command and Output Directory **empty**
4. Deploy

Later pushes to `main` redeploy automatically.

## Note

This is a revision aid for use outside the exam hall. It is not for use in a real examination.
