# Redesign baseline — 2026-09-12

Recorded before any redesign work. Every claim here was checked by running the code, not by reading the audit.

## Shape of the project

- **No framework, no build, no package.json, no node_modules.** One self-contained `index.html` (136,527 bytes, 3,137 lines) plus `README.md` and `docs/`. There is nothing in `node_modules` to read; "framework documentation" does not apply.
- **Deploy:** `git push origin main` → Vercel serves the file as static. No build command. Live at https://cie-cs-toolkit.vercel.app.
- **Runtime constraint (project rule):** offline-capable, zero dependencies, no CDN scripts, no AI/API calls. Every feature is rule-based.

## Layout of `index.html`

| Lines | What |
|---|---|
| 7–155 | `<style>` — tokens in `:root`, then component CSS |
| 156–407 | Markup: header, tab strip (5 tabs + Practice button), 6 panels, footer |
| 408–2452 | **SCRIPT 1** — pure logic, no DOM, `module.exports` for Node. Modules: A interpreter (tokenize → parse → generator exec), C Structured English → pseudocode, D trace table → pseudocode, E flowchart SVG, F practice questions + markers, B boolean expr → truth table + circuit, then `EXAMPLES`, `TESTS`, `runSelfTest` |
| 2457–3119 | **SCRIPT 2** — DOM wiring per tab, toast, tab switching, practice UI |

## Boundaries

- **Interpreter:** `tokenize(src)` → `parseProgram(lines)` (AST: DECLARE, CONST, ASSIGN, INPUT, OUTPUT, IF, CASE, FOR, WHILE, REPEAT, NOP) → `execBlock` generator yielding one snapshot per executed line → `runProgram(code, inputText)` returns `{ steps, env }`. Limits: `MAX_STEPS = 3000`. No output-length limit. No PROCEDURE/FUNCTION, recursion, 2-D arrays or files (documented as unsupported).
- **Grader (Module F):** `makeQuestion(kind, seed)` builds from 5 `PRACTICE_TEMPLATES` (each: `build(rnd)` → `{ code, english }`, constants baked in, **no INPUT**). `markPseudocode(q, code)` runs the student's program **once with no inputs** and compares its output list with the reference's. Consequence, reproduced in Node: a hard-coded `OUTPUT 58` passes "larger of two numbers". `markTrace`, `markOutput`, `markTruth` mark prediction tasks and are not affected.
- **Question data:** templates only — no id, qualification, syllabus version, topic, marks, hidden cases, hints or provenance.
- **localStorage:** one key, `cie-practice-score` = `{ asked, right }`, in try/catch. No versioning, no migrations, no export.
- **Tests:** `TESTS` array in SCRIPT 1, 48 assertions, all passing; run via `?selftest=1` in the browser or the Node one-liner in the README. No accessibility, keyboard or end-to-end tests. One existing test (`Practice: any working program is accepted…`) *asserts the buggy behaviour* — it expects a program that only prints the expected values to pass.

## CSS

- Tokens in `:root`: `--bg --panel --panel2 --line --text --muted --dim --accent --accent-dim --warn --err --ok --mono --sans`.
- Raw colours outside tokens: `rgba(98,208,180,.13)` (line 65), `#378372` + `#fff` (83), `rgba(255,255,255,.018)` (100), `rgba(98,208,180,.10)` (101).
- Toast uses `transition:.18s` (all properties). `prefers-reduced-motion` is honoured globally.
- Responsive: `.cols` collapses to one column under 900px; the tab strip wraps, so on a phone the five tabs plus Practice stack and push the tool down.

## Accessibility and metadata (verified by grep)

- `#code` textarea: no associated `<label>`.
- Generated inputs in `#tt-grid` and `#q-answer`: no accessible name.
- Tabs are `role="tab"` buttons; no `tablist` keyboard (arrow-key) handling; no skip link; no `aria-live` region for run/check results.
- `<head>`: only charset and viewport. No description, no icon (favicon 404), no canonical, no Open Graph.
- Header reads `9618 / 9608 · 0478`; 9608 is a legacy syllabus and should not be presented as current.
- `--muted #8B95A3` on `--bg #0F1216` ≈ 6.5:1 (OK); `--dim #5C6773` on `--bg` ≈ 3.2:1 (fails AA for normal text) — used for the header subtitle, help text and the score line.

## Verification commands

    # self-test in Node (same assertions as ?selftest=1)
    node -e 'const fs=require("fs"),os=require("os"),p=require("path");
    const s=fs.readFileSync("index.html","utf8").match(/<script>([\s\S]*?)<\/script>/)[1];
    const f=p.join(os.tmpdir(),"core.js");fs.writeFileSync(f,s);
    const r=require(f).runSelfTest();
    r.forEach(x=>console.log((x.ok?"PASS ":"FAIL ")+x.name));
    console.log(r.filter(x=>x.ok).length+"/"+r.length);'

    # syntax check of both script blocks
    node --check <extracted block>

## Plan order (from the brief)

0 baseline (this file) → 1 trustworthy grading → 2 syllabus/course architecture → 3 learning data layer → 4 application shell → 5 practice workspace → 6 mobile → 7 accessibility → 8 interpreter extensions → 9 award evidence → 10 verification. Each phase: tests, self-check, focused commit.
