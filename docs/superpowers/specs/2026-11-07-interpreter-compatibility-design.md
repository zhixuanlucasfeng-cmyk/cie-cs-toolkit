# DryRun Interpreter Compatibility Design

## Intent

Make the DryRun editor reliably execute the Cambridge-style pseudocode students actually write in class. The interpreter should reject genuinely invalid typed code, while the existing benefit-of-doubt normalizer continues to accept harmless notation differences.

## Scope

This upgrade covers the gaps confirmed against the current DryRun engine and Faisal Fakih's public interpreter tests:

- identifiers are case-insensitive;
- assignment, array cells, parameters and function returns reject values incompatible with their declared types;
- exponentiation with `^` follows the 0478 classroom dialect: right-associative, tighter than multiplication, and available regardless of selected course;
- `CASE` accepts single values and inclusive `low TO high` ranges;
- unquoted `DD/MM/YYYY` DATE literals, DATE values and Cambridge date/string conversion built-ins work;
- whole arrays can be copied and passed BYVALUE or BYREF without aliasing mistakes;
- grouped routine parameters are accepted;
- simple enumerated `TYPE Name = (A, B, C)` declarations work.

## Non-goals

- Do not copy or import GPL interpreter source.
- Do not rewrite the editor UI or split the one-file production runtime.
- Do not add runtime dependencies.
- Do not loosen errors that would hide a real type or bounds mistake.
- Do not change persistence, course data, questions or grading storage.

## Design

Keep the existing tokenizer → parser → AST → generator pipeline. Add the smallest missing syntax and runtime rules in the existing shared paths so the editor, grader, trace table and worker all receive the same behavior.

Identifiers are normalized only for lookup; their declared spelling remains available for trace-table labels and messages. Scalar values use the current JavaScript primitives. Numeric assignment validation is value-based: an integer-valued result such as `4 / 2` can enter an INTEGER, while `2.5` cannot. Single-character quoted values can enter either CHAR or STRING. DATE and enum declarations remain distinct through their declared destination type.

DATE values use canonical `DD/MM/YYYY` strings validated with UTC-based native `Date` arithmetic, avoiding timezone drift and a new date library. `TODAY()` reads the current local calendar date in production; tests exercise the deterministic parsing and calendar helpers rather than pinning today's value. `DAYINDEX` uses Sunday = 1.

Arrays remain the existing `{ dims, cells }` slots. Whole-array assignment requires matching dimensions, size and element type, preserves the target bounds, copies cells by position and does not alias. Routine array parameters use `A : ARRAY[low:high] OF TYPE`. BYVALUE clones the slot; BYREF aliases the caller slot immediately, including repeated aliases. FUNCTION parameters may not be BYREF. Grouped parameters means Cambridge passing-mode inheritance (`BYREF X : INTEGER, Y : INTEGER` makes both BYREF), not `X, Y : INTEGER` shorthand.

CASE follows the broader 9618 form: inclusive ranges, multiple statements per arm, one final OTHERWISE, source-order matching for overlapping ranges, and an error for reversed ranges. The existing one-line `value : statement` form remains valid.

## Acceptance criteria

- Every confirmed compatibility gap has a regression test that failed before its implementation.
- Existing valid programs still run and existing invalid programs still report useful line errors.
- `npm test` passes in Node and Chromium.
- No runtime package or copied third-party interpreter code is introduced.

