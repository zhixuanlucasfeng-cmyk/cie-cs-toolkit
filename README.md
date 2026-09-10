# CIE CS Revision Toolkit

Two revision tools for Cambridge Computer Science (9618 / 9608 / 0478) candidates: a single file, pure front-end, zero dependencies, works offline.

**Online:** https://cie-cs-toolkit.vercel.app　·　[run the self-test](https://cie-cs-toolkit.vercel.app/?selftest=1)

## The two modules

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

## Built-in self-test

Correctness is covered by 21 assertions (interpreter semantics, the CIE-specific errors, truth tables, operator precedence, NAND/NOR).

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
