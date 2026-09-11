# Structured English → Pseudocode, and Trace Table → Pseudocode

Date: 2026-09-11
Status: approved (in chat), ready to implement

## Goal

Two new student-facing conversions in the CIE CS toolkit, both producing **Cambridge-standard pseudocode**:

1. **Structured English → pseudocode**, plus the trace table for the generated program (not only its final output).
2. **Trace table → pseudocode**: the student fills in a trace table by hand and gets the program that would produce it.

## Constraints (decided with the user)

- **Pure rule-based, offline.** No API, no key, no network. The file stays a single self-contained `index.html` with zero dependencies, so it keeps working in a school with no internet and the teacher can verify it with `?selftest=1`.
- **Structured English: a whitelist of CIE textbook sentence forms.** Case and indentation are free. An unrecognised sentence is reported by line number with the accepted forms listed — never silently reinterpreted.
- **Trace table → pseudocode: straight-line code plus automatic loop detection.** No guessing of `IF` conditions.

## Components

Both engines live in SCRIPT 1 (no DOM), so Node can require them and the built-in self-test covers them.

### `structuredEnglishToPseudo(text) -> { code, notes }`

- Indentation drives block nesting (an indent stack, like Python); explicit `End if` / `End while` / `Next x` are also accepted.
- A pattern table maps each whitelisted sentence to one pseudocode statement:
  `Set X to …`, `Add … to X`, `Subtract … from X`, `Multiply X by …`, `Increase/Decrease X by …`,
  `Input …`, `Output …`, `If … then` / `Otherwise` / `End if`,
  `Repeat` / `Until …`, `While … do` / `End while`, `For each X from A to B` / `Next X`.
- Condition and expression words are rewritten: `is greater than` → `>`, `is not equal to` → `<>`, `plus` → `+`, `divided by` → `/`, and so on.
- Variable names come from the sentence with articles stripped (`a number` → `number`, `the total score` → `totalScore`).
- `DECLARE` lines are inferred from the first value assigned to each variable and emitted at the top, in first-use order.

### `traceTableToPseudo(table) -> { code, notes }`

`table = { vars: [name…], rows: [{ line, values: {name: text}, output }] }`. A blank cell means "unchanged", so a student can fill the table the usual way.

1. Each row is diffed against the previous one; every changed cell becomes an assignment, a non-empty OUTPUT cell becomes an `OUTPUT`.
2. Repeated line numbers are scanned for the longest consecutively repeating block — that block is the loop body.
3. A variable whose values across repetitions form an arithmetic sequence becomes the `FOR` control variable: `FOR v ← first TO last STEP step` (`STEP` omitted when 1).
4. Each assignment's right-hand side is inferred from a fixed candidate list — `X + k`, `X - k`, `X + Y`, `X - Y`, `X * Y`, `X * k`, `Y`, `Y + k`, literal — and must hold for *every* repetition of the loop body, otherwise the code falls back to a literal.
5. `DECLARE` lines come from the value types, in column order.

### Error handling

Neither engine invents anything:

- Unknown sentence → `line N: …` plus the accepted forms.
- A cell whose change cannot be explained → `// cannot infer this step` on that line, and the status bar names the row.
- A loop is detected but no arithmetic control variable → the block is written out in full with a note, rather than an invented `WHILE` condition.

### Self-verification (trace table tab)

The generated pseudocode is run back through the existing interpreter and its outputs and final variable values are compared with the student's table: ✓ when they agree, otherwise the first disagreement is named. This reuses the interpreter, so it costs almost nothing.

## UI

Two new tabs alongside the existing two, reusing the current tab machinery:

3. **Structured English → Pseudocode** — English on the left, generated pseudocode on the right, the full trace table underneath, and a "Send to Tab 1" button for stepping through it.
4. **Trace Table → Pseudocode** — an editable grid (student names the variable columns, then fills `Line | values | OUTPUT` rows), a Generate button, the pseudocode, and the verification result.

## Testing

The built-in self-test grows from 21 assertions to roughly 35:

- one case per whitelisted English sentence form;
- **round-trip**: each of the 9 built-in examples is run to produce a trace table, that table is fed to `traceTableToPseudo`, and the regenerated program must produce the same output;
- the error paths: unknown sentence, unexplainable cell.

## Known ceilings

- Structured English only understands the whitelist; a freely worded sentence is rejected, not guessed.
- A trace table containing an `IF` branch yields straight-line code, not an `IF` (the user chose not to guess conditions).
- Right-hand-side inference searches a fixed candidate list, so an unusual expression falls back to a literal value.

## Addendum (same day): flowchart module

A fifth tab takes a flowchart written one box per line and returns the drawn chart, the pseudocode and the trace table.

- **Input**: each box is either CIE pseudocode or module 3's structured English. The two are told apart by trying the pseudocode parser first and falling back to the English engine — unless the text clearly is pseudocode (`←`, `DECLARE`, `ENDIF`, `ENDWHILE`), in which case the pseudocode error is the honest one to report. `START` / `STOP` / `BEGIN` / `END` lines are stripped.
- **Drawing** (`flowchartSVG`) works from the parsed AST plus the original source line for each box's label, so the box text is exactly what the student wrote. Layout is a recursive block model: every block reports `left`/`right` from its vertical axis and a height, sequences stack on one axis, `IF … ELSE` puts its branches in two side columns that rejoin, and loops return up a lane of their own. `FOR` is decomposed into an init box, a test diamond, the body and an increment box.
- **Shapes**: stadium for terminators, rectangle for processes, parallelogram for input/output, diamond for decisions, with `Yes` / `No` on the branches.
- **Ceiling**: `CASE OF` is refused with advice to rewrite as `IF … ELSE` rather than drawn wrongly.
