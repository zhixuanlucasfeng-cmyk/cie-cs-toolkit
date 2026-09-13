# Pilot readiness — 2026-09-13

Prepared for a pilot with 5–10 Cambridge Computer Science teachers and their students. Everything below was run, not assumed.

## Root cause of the course-isolation bug

The store was **one flat record with a single `profile` field**. `setProfile()` replaced that label and left every learner record — attempts, session, diagnostics, reviews, topic evidence — untouched, so it was immediately attributed to the new course.

Two distinct leaks, reproduced in Node before any change:

1. **Across qualifications.** After 0478 → 9618, the A Level profile showed the IGCSE attempts, the IGCSE diagnostic, the IGCSE review queue and the IGCSE session, still resumable.
2. **Within one qualification** (not in the original report, and worse). `9618-2026` and `9618-2027-2029` share topic codes such as `9618.11`, so evidence earned as **AS 2026** appeared as **SECURE** for **A Level 2028** — a topic marked secure on a course where nothing had ever been attempted.

Topic evidence only *looked* isolated across qualifications because 0478 and 9618 use different topic codes. That was an accident, not a design.

## The fix

A stable profile identity: `qualification | syllabusVersion | examYear | level`, e.g. `0478|0478-2026-2028|2027|IGCSE`. Exam year and level are part of the key precisely because leak 2 could not be caught without them.

Store v3:

```
{ version, activeProfileId,
  profiles: { "<id>": { id, qualification, syllabusId, examYear, level, confidence,
                        attempts[], topics{}, reviews{}, session, diagnostics[] } },
  feedback: [],        // about the tool, not a course
  createdAt }
```

- Every read and write goes through the active profile. Recording with no course selected is refused rather than written somewhere arbitrary.
- Every attempt is stamped with its `profileId`, so ownership survives export and import.
- Switching course drops the in-memory session so a different course can never continue it; the saved session stays with its own profile and is still there on return.
- Erase is offered per course or for everything, and says which.

## Storage migration

`dryrun.store.v2 → v3` runs on first read; the v2 key is left untouched.

- Everything under v2 moves wholesale under the profile that was active when it was written, with each attempt stamped with that id.
- If v2 had data but no profile, it is kept under `unassigned|unassigned|0|-` and **not activated**, so it is neither erased nor wrongly attributed.
- Unreadable data is copied aside under a `.corrupt.<timestamp>` key and a fresh record is started, with the reason surfaced.
- Feedback is carried across as tool-level, not course-level.

## Tests

136 assertions, all passing in Node and in the browser (`?selftest=1`). Baseline before this work was 120.

New this round (16):

| Test | Proves |
|---|---|
| Isolation 1 | A 0478 attempt never appears in the 9618 dashboard |
| Isolation 2 | A 0478 session cannot be continued after switching to 9618 |
| Isolation 3 | Switching back to 0478 restores its own history, still stamped with its own course |
| Isolation 4 | AS and A Level records stay separate |
| Isolation 5 | Different exam years do not share evidence, despite identical topic codes |
| Isolation 6 | Export and import preserve course ownership |
| Import twice | Re-importing your own data does not duplicate attempts |
| Rubbish import | Refused without touching what is already stored |
| Migration ×2 | v2 data is moved under its owner; v2 data with no course is kept, not attributed |
| Coverage ×3 | Figures match the bank; an empty topic is never shown as available; 2029 is flagged as Python |
| Honesty ×2 | No endorsement or grade claim anywhere; the landing page invents no users, schools or results |
| Routes | Welcome and privacy exist and need no course |

Eight existing store tests were updated because recording now requires a course to be selected — that refusal is the new safety property, not a regression.

## Verification results

**Test command**

```
node -e '…extract SCRIPT 1 and call runSelfTest()…'   →  136/136
?selftest=1 in the browser                             →  136/136
```

**Manual course-switch journey** — all ten steps passed in Chrome:

1. New student lands on `#/welcome`; "Try the diagnostic" → onboarding.
2. 0478 / 2027 / IGCSE → dashboard, chip reads `0478 · 2027 · IGCSE`.
3–4. One question answered correctly → 5/5, one row of evidence.
5. Switched to 9618 / 2027 / A Level.
6. No 0478 attempt, action, evidence, review item or session visible.
7. One 9618 question answered → 6/6.
8–9. Switched back via the course list; the IGCSE attempt returned, per-profile counts `0478/IGCSE:1  9618/A Level:1`.
10. Exported, erased everything, re-imported through the real file input: both profiles restored, ownership intact on every attempt.

**Responsive** — no horizontal overflow at **188, 320, 375, 414, 768, 1280 px** across welcome, onboarding, practice, both labs, dashboard, progress, evidence, settings, privacy and about. 188px is a 375px phone at 200% browser zoom (browser zoom shrinks the CSS viewport; scaling content with `zoom` is not the same test and gives a false failure).

On the practice screen at phone widths: sticky bar shows Run / Hint / Check, the duplicate question toolbar is hidden, the timer reads "about 24 min left", End session is 115×44, and the editor is 361px tall with the prompt still visible.

**Bugs found by testing this round, all fixed**

1. The onboarding "Start learning" handler was dropped during the rewrite — the button enabled correctly and did nothing.
2. `.action-bar`'s `display:flex` beat the UA `[hidden]` rule, so the sticky bar showed as an empty strip on every view.
3. Lab tab labels wrapped to two lines at 320px.
4. Grid children (`min-width:auto`) pushed the page sideways on the new landing grids — the same trap as an earlier fix, in new places.
5. The app bar could not fit its controls at 173px.
6. Long topic pills refused to wrap and overflowed the practice panel.
7. The brand wordmark, now a button, was a 32px touch target.
8. A student on a new device could not import a backup, because Settings is gated behind choosing a course. Import is now on the first screen too.

**Console** — no errors from the page across every view. **Network** — exactly one request, the page itself. No fonts, analytics or third-party scripts. **Contrast** — checked against the live custom properties as part of the self-test.

## Remaining limitations

- **No pilot data exists.** The Evidence page says so, and the landing page carries "Teacher pilot evidence coming soon" rather than invented figures.
- **No class dashboard.** Teachers receive evidence as files a student exports; there is no aggregation view.
- **Coverage is partial and stated as such.** 0478 Databases has no questions and is shown as coming soon. 0478 practice is Paper 2 reasoning and pseudocode only.
- **Offline is "after load", not installable.** Everything is inline, so no further requests are made, but there is no service worker, so a reload with no network depends on the browser cache.
- **Lighthouse was not run** in this environment.
- **The 2029 0478 syllabus** is selectable and clearly flagged as Python 3, but no Python tooling exists here.

## Recommended next step

Run the pilot with two teachers first, not five. Give each a one-page brief: the link, "students export a JSON file at the end", and the two questions worth answering — *did the hidden-test-case marking change how students revise?* and *was the misconception naming accurate?* Two teachers will surface the workflow problems that ten would only repeat, and their exports are the first real evidence this project has.
