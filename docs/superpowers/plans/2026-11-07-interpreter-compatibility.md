# DryRun Interpreter Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the interpreter gaps that made valid classroom pseudocode run on Faisal's IDE but fail or behave incorrectly in DryRun.

**Architecture:** Extend the existing dependency-free tokenizer, parser and runtime in `index.html`. Put each rule in the shared parser/environment path so the editor, grader, trace table and worker stay consistent.

**Tech Stack:** Static HTML, JavaScript, Node.js self-tests, Playwright Chromium

**Spec:** `docs/superpowers/specs/2026-11-07-interpreter-compatibility-design.md`

## Global Constraints

- Preserve the one-file, dependency-free production runtime.
- Do not copy Faisal's GPL source.
- Preserve persistence, questions, grading data and UI behavior.
- Add every behavior through a red-green regression test.

## Review Focus

- Mixed-case identifiers must resolve without merging two declarations that differ only by case.
- INTEGER must reject non-whole numeric values and strings; REAL may accept integer values.
- Invalid dates, leap days and date ranges must use UTC calendar arithmetic and remain deterministic across timezones.
- Array copying must not alias cells; BYREF must intentionally write back.
- Operator precedence must pin `-2^2 = -4`, `2^-2 = 0.25`, and `2^3^2 = 512`.

---

### Task 1: Scalar language compatibility

**Files:**
- Modify: `index.html` interpreter and compatibility matrix

**Interfaces:**
- Consumes: `tokenize`, expression parser, `Env`, `assignTo`, `callFunction`
- Produces: case-insensitive names, typed scalar assignments, exponentiation

- [ ] Add failing tests for mixed-case lookup, duplicate declarations by case, typed assignment/return errors and `^` precedence.
- [ ] Run `npm run test:core` and confirm those tests fail for the expected reasons.
- [ ] Normalize environment keys, add one shared scalar validator, and add right-associative `^` parsing/evaluation.
- [ ] Run `npm run test:core` and confirm the new tests pass.

### Task 2: CASE, DATE and built-ins

**Files:**
- Modify: `index.html` parser, value helpers and compatibility matrix

**Interfaces:**
- Consumes: `parseCase`, `FUNCS`, typed assignment path
- Produces: inclusive CASE ranges, canonical DATE values, Cambridge conversion/date functions

- [ ] Add failing tests for CASE ranges and multi-statement arms; unquoted dates; leap-date validation; `ASC`, `CHR`, `NUM_TO_STR`, `STR_TO_NUM`, `IS_NUM`, `DAY`, `MONTH`, `YEAR`, `SETDATE`, `TODAY` and `DAYINDEX`.
- [ ] Run the core suite and confirm the expected failures.
- [ ] Implement the syntax and helpers with native JavaScript only.
- [ ] Run the core suite and confirm the new tests pass.

### Task 3: Arrays, grouped parameters and enum types

**Files:**
- Modify: `index.html` tokenizer, parser, environment, routine binding and compatibility matrix

**Interfaces:**
- Consumes: array slots, `parseRoutine`, `bindArguments`, `applyWriteBacks`
- Produces: array copy, array parameters, grouped parameter declarations and simple enum values

- [ ] Add failing tests for deep array copy, dimension/type mismatch, BYVALUE/BYREF array aliases, BYREF mode inheritance, FUNCTION BYREF rejection and enum assignment/type errors.
- [ ] Run the core suite and confirm the expected failures.
- [ ] Add the minimum AST and slot handling needed for those cases.
- [ ] Run the core suite and confirm the new tests pass.

### Task 4: Full verification

**Files:**
- Modify: `README.md` only if the verified test count is documented there

**Interfaces:**
- Consumes: all preceding interpreter behavior
- Produces: a verified browser-deployable build

- [ ] Run `npm test` and require zero core or Chromium failures.
- [ ] Run the classroom maze and the eight comparison snippets stored as compatibility-matrix fixtures through the exported engine.
- [ ] Inspect `git diff --check` and the final diff for unrelated changes.
- [ ] Update any exact test-count documentation and re-run `npm test`.

