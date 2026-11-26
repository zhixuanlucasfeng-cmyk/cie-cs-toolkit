# Logic workspace and classroom interpreter repair — 2026-11-26

## Starting point and cause

Work started from production main `7e0af8c`, preserving its SEO routes and metadata. The original working directory and its unpublished changes were left intact. Four existing interpreter commits were cherry-picked before the additional repair.

Production ran a basic arithmetic program, but rejected a CASE range that ran on cambridge-pseudocode.com. Nine of fifteen initial classroom checks failed against the production source. Missing or unpublished behavior included case-insensitive identifiers, array parameters, BYREF aliases and output parameters. Function calls also used a synchronous evaluator that could not suspend for interactive INPUT.

## Changes

- Make expression evaluation and routine calls yield through the existing interpreter generator. INPUT inside a function can now pause, validate input and resume. Functions participate in stepping, tracing and execution limits.
- Use global lexical scope for called routines; support grouped typed parameters. Retain return-type validation and the distinction between equality `=` and assignment `←`.
- Preserve function-local columns in trace tables. Run can restart a completed program. Add runnable BYREF swap and recursive factorial examples.
- Give Logic a viewport-wide workspace with a large circuit canvas, zoom and fit controls, clickable input switches and a synchronized truth table. Use side-by-side panels on large screens and stacked panels on tablets and phones. Navigation remains available through the menu.
- Keep existing themes, storage keys, public routes and SEO configuration.

## Verification before deployment

`npm test`: 267 core self-checks, 19 classroom Node tests, 3 SEO artifact tests and 29 Chromium browser tests passed.

`npm run test:compat`: 16 tests passed across WebKit and iPad touch emulation. Viewports include 1440×900, 1366×768, 1180×820, 820×1180 and 390×844. These are browser/device simulations, not physical hardware certification.

Classroom coverage includes procedures, functions, grouped parameters, BYVAL, BYREF, uninitialized output parameters, aliasing, one- and two-dimensional array parameters, recursion, nested calls, CASE ranges, INPUT inside routines, return validation and interrupt/step limits. It does not establish complete Cambridge language conformance.

## Deployment and maintenance

The GitHub main branch deploys automatically through Vercel project `cie-cs-toolkit` to https://dryruncs.com. Compare production `/app.js` and `/app.css` with the generated `dist` files, then run classroom and navigation browser checks against production. Keep test visits separate from organic usage reporting.

Use `npm test` after interpreter or route changes and `npm run test:compat` after layout or input changes. Source remains in `index.html`; generated `dist` output must not replace the source. The original unpublished working directory must not be pushed over the newer main branch.
