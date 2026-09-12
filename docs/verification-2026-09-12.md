# Verification record — 2026-09-12

Everything below was run, not assumed. Where a check found a problem, the problem is named and the commit that fixed it is given.

## Self-test

102 / 102 assertions pass, in Node and in the browser (`?selftest=1`). Two are browser-only (WCAG contrast read from the live custom properties, and the DOM/metadata checks) and pass trivially under Node, where there is no document.

Baseline was 48. The one test removed asserted the grading bug it is now impossible to reproduce ("a different program with the same output should pass"); it was replaced by its inverse.

## End-to-end journey, from cleared storage

| Step | Result |
|---|---|
| First visit | Onboarding shown |
| Choose 9618, exam year 2028, A Level | Resolved to the 2027–2029 syllabus version, note about its own pseudocode guide shown |
| After finishing onboarding | Dashboard; chip reads `9618 · 2028 · A Level` |
| Dashboard with no attempts | "No evidence yet", one recommended diagnostic, no mastery chart |
| Practice, code question | Topic, paper, difficulty, marks and estimated time shown |
| Submit `OUTPUT 4` (the visible answer, hard-coded) | **1 / 6.** "This question asks you to use a loop." Not correct |
| Show answer after one attempt | Still disabled |
| Submit a real REPEAT/DIV solution | **6 / 6**, all four mark categories awarded, "works for all 5 test cases, including the ones you could not see" |
| Reload the page | No re-onboarding; course remembered |
| Progress | 2 attempts recorded, topic DEVELOPING, other topics UNSCOUTED |
| Review queue | The failed question is in it, reason `missing-construct`, without being re-entered by hand |

## Responsive

Measured inside iframes, because window resizing does not change the viewport on this machine. Horizontal overflow at 320, 375, 414, 768 and 1440 across dashboard, practice, both labs, progress, evidence, settings, about and onboarding: **none**.

Three real bugs were found this way and fixed in `6355aca`:

1. The app bar's right-hand group did not fit at phone width and pushed the page to 537px.
2. `.practice-layout` kept `align-items:flex-start` when it became a column, so children took content width instead of stretching.
3. Grid children default to `min-width:auto`, so a wide table or circuit SVG refused to shrink.

Touch targets below 44px on mobile (menu button, course chip) were also fixed there.

## Accessibility

Checked in the browser and then locked in as assertions:

- no form control without an accessible name; the editor has a real label, not a placeholder
- generated trace cells read as "Row 3, line 7, variable total"
- skip link, `main` landmark, labelled `nav`
- `aria-live` on every status element
- tablists: one selected tab, `aria-controls` on each, arrow keys and roving tabindex working
- drawer: focus moves in on open, Escape closes, focus returns to the opener
- every text token meets 4.5:1 against every surface it is used on, computed from the live stylesheet
- correctness is never colour alone — marked cells also carry a ✓ or ✗ glyph

## Console

Walking all eight views produced no errors from the page. The only two exceptions in the log came from the iframe test harness reading `contentDocument` after its iframe was removed.

## Security and limits

No `eval()` and no `Function()` anywhere. Enforced: 3000 execution steps, 500 output lines, recursion depth 120, 20000 array cells, 2000 file lines. File names are stripped to `[A-Za-z0-9._ -]`, so the sandbox cannot be addressed outside. Storage writes are versioned, migrate forward, keep an unreadable record aside rather than erasing it, and surface a full quota.

## Known gaps, stated rather than hidden

- The question bank is 16 questions. That is enough to prove the marking model but is not the 8–12 per objective the brief asks for; the remaining topics show honestly as having no questions rather than being padded.
- No study has been run. The Evidence page says so in those words.
- Lighthouse was not run in this session; the audit's earlier scores predate this rebuild, and the changes since (favicon, description, canonical, contrast, labels) all move in the right direction, but that is a prediction, not a measurement.
