# DryRun Stabilization Design

## Goal

Make the repository trustworthy to change by ensuring the browser test result is real, reproducible locally, and required before deployment.

## Scope

This phase fixes the three browser-only self-test failures, adds a real-browser test runner, and adds a GitHub Actions verification gate. It does not split `index.html`, change the visual design, add product features, change the interpreter contract, or modify the `dryrun.store.v3` persistence schema.

## Root cause

The production `?selftest=1` route calls `runSelfTest()` at the beginning of the page-interaction script. At that point the page markup exists, but UI event handlers and dynamic IDE tabs have not been initialized. The two circuit tests click controls whose handlers are not installed yet, and the tablist test inspects the still-empty IDE file tablist. Node reports 235/235 because DOM-dependent tests return early when `document` is unavailable.

## Design

Keep the existing inline test definitions and zero-dependency production runtime. Add Playwright only as a development dependency so the test suite can load the actual page in Chromium. Defer rendering the self-test report until after the normal UI wiring and boot initialization have completed. The report still replaces the page and remains available at the same `?selftest=1` URL.

Add two automated layers:

1. A Node core runner for pure logic.
2. A Playwright browser test that asserts the rendered report has no failures and reads `235 / 235 passed`.

GitHub Actions runs both layers on pushes and pull requests. Production remains a single static HTML file with no runtime package or network dependency.

## Safety constraints

- Do not change storage keys, migrations, imports, exports, snapshots, or learner/course ownership.
- Do not change question content, marking rules, interpreter semantics, or syllabus coverage.
- Do not add a runtime framework or runtime dependency.
- Do not push or deploy from this phase.
- Preserve `?selftest=1` as the public manual verification URL.

## Acceptance criteria

- The browser test fails against the current baseline for the known three failures.
- After the fix, Node reports 235/235 and Chromium reports 235/235.
- The ordinary home page still boots without console errors.
- GitHub Actions contains a verification workflow for both test layers.
- README test counts and commands match the current suite.
