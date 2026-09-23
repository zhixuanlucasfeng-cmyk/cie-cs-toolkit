# Guided Flowchart Builder Design

## Goal

Let a student construct a valid flowchart directly in DryRun and convert that same work into structured English, Cambridge-style pseudocode, and an executable trace table.

The builder is for learning algorithm structure, not for producing arbitrary diagrams. It must prevent invalid control flow instead of accepting a broken graph and guessing what the student meant.

## User outcome

A student can open the Pseudocode Lab, choose **Build a flowchart**, add and edit standard flowchart steps, and immediately see a connected diagram. The finished chart can be read as structured English, converted to pseudocode, run with sample input, traced, and opened in the existing IDE.

The first release supports:

- sequence;
- input;
- output;
- processing and assignment;
- `IF / ELSE` selection;
- `WHILE` loops;
- `REPEAT / UNTIL` loops.

## Product constraints

- Keep the production application self-contained in `index.html` with no runtime dependency or network request.
- Work offline and without an account.
- Preserve the existing interpreter, question marking, student progress, course ownership, storage migrations, imports, exports, and snapshots.
- Do not allow arbitrary freehand connectors in the first release.
- Use the site's existing visual language, standard flowchart shapes, keyboard focus styles, dark theme, and responsive layout.
- Treat `START` and `STOP` as structural terminators. They are always present and cannot be deleted.

## Chosen interaction model

The builder uses a guided structured editor rather than a free graph canvas. The visible chart contains insertion controls between steps. A student chooses the next construct, fills in its fields, and DryRun lays out and connects the chart automatically.

This choice makes every completed chart convertible. A free graph editor would need to handle disconnected nodes, multiple starts, ambiguous joins, missing branch labels, and irreducible cycles before it could safely generate code.

### Editing operations

- Add a step before or after an existing step.
- Add a step inside an `IF` branch or loop body.
- Edit a node by selecting it in the chart.
- Delete a node or structured block, with confirmation when deleting a block also removes nested steps.
- Move a step up or down within its current sequence.
- Reset to a small starter chart.
- Undo and redo in memory for the current browser session.

The first release does not support dragging a node between branches or manually repositioning shapes. Those can be added later without changing the document model.

## Interface

Add a **Build a flowchart** tab to the Pseudocode Lab. The workspace has three coordinated areas:

1. **Toolbar** — buttons for Input, Output, Process, IF / ELSE, WHILE, and REPEAT / UNTIL, plus undo, redo, reset, and example.
2. **Chart** — an interactive, automatically laid-out SVG using terminators, parallelograms, rectangles, and decision diamonds. Selected nodes are visually distinct. Keyboard users can tab to nodes and insertion controls, and activate them with Enter or Space.
3. **Inspector and results** — fields for the selected node, validation messages, generated structured English, generated pseudocode, sample input, trace table, Copy, and Open in IDE.

On narrow screens the areas stack in that order. The chart remains horizontally scrollable when a two-branch structure cannot fit the viewport without making labels unreadable.

When a node is selected, a toolbar action inserts the new step immediately after it in the same sequence. When an empty branch or loop-body insertion control is selected, the action inserts into that exact container. If nothing is selected, it appends to the program's top-level sequence.

## Document model

The editable source of truth is a versioned structured document, not SVG markup and not generated pseudocode.

```js
{
  version: 1,
  body: [Step]
}
```

Every step has a stable local `id` and one of these shapes:

```js
{ id, type: 'input', name, dataType? }
{ id, type: 'output', expression }
{ id, type: 'process', target, expression, dataType? }
{ id, type: 'if', condition, then: [Step], else: [Step] }
{ id, type: 'while', condition, body: [Step] }
{ id, type: 'repeat', condition, body: [Step] }
```

`START`, `STOP`, arrows, joins, and Yes/No labels are derived during rendering. They are not stored as editable nodes. Loops are represented as nested blocks, so a back edge is unambiguous and cannot point to an unrelated node.

Stable IDs are used only for selection, editing, and keyed DOM updates. They are not included in generated English or pseudocode.

## Conversion rules

One recursive compiler walks the document and produces both textual representations. The two outputs therefore describe the same structure rather than being inferred from each other.

Examples of canonical output:

| Node | Structured English | Pseudocode |
|---|---|---|
| Input | `Input n` | `INPUT n` |
| Output | `Output total` | `OUTPUT total` |
| Process | `Set total to total + n` | `total ← total + n` |
| If | `If total > 10 then … Otherwise … End if` | `IF total > 10 THEN … ELSE … ENDIF` |
| While | `While n > 0 do … End while` | `WHILE n > 0 DO … ENDWHILE` |
| Repeat | `Repeat … Until n = 0` | `REPEAT … UNTIL n = 0` |

Declarations are generated in first-use order using the existing inference rules where possible. If the builder cannot infer a type safely, the inspector asks the student to choose `INTEGER`, `REAL`, `BOOLEAN`, `CHAR`, or `STRING`; it does not silently guess.

Generated pseudocode is passed to the existing parser and interpreter. A trace table is shown only when parsing succeeds and the supplied sample input is sufficient.

## Validation and error handling

Validation runs after every edit. It returns errors tied to node IDs so the chart and inspector can identify the exact problem.

The builder rejects or highlights:

- blank variable names, expressions, or conditions;
- invalid identifiers;
- incomplete `IF`, `WHILE`, or `REPEAT` conditions;
- an empty loop body;
- syntax the existing pseudocode parser cannot accept;
- missing sample input when execution reaches `INPUT`;
- documents that exceed conservative node or nesting limits.

An empty `IF` branch is allowed and is shown as an explicit empty path. Conversion remains disabled while any blocking error exists. The student's unfinished chart stays editable and saved.

Set initial safety limits of 100 editable nodes and 12 levels of nesting. These are well above normal school exercises while protecting layout and recursive conversion from accidental abuse.

## Persistence

Autosave one flowchart draft in local storage under a new isolated key, `dryrun.flowchart.v1`. Do not place it inside `dryrun.store.v3`, because it is a tool draft rather than course evidence.

Save only the versioned document and sample input. Do not save derived SVG, generated text, validation output, selection, or undo history. If stored JSON is missing, malformed, or from an unsupported version, keep it untouched, load a safe starter chart, and explain that the saved draft could not be opened.

This feature does not sync, count toward progress, or alter exported student evidence in the first release.

## Internal boundaries

Although production remains one HTML file, keep the new logic in clearly labelled, independently testable sections:

- document creation and immutable editing operations;
- validation;
- structured-English and pseudocode generation;
- SVG layout and rendering;
- local draft persistence;
- UI event wiring.

Pure functions must not read the DOM or local storage. The UI passes a document in and receives a new document or rendered result out. This keeps the conversion and validation testable in the existing Node self-test runner.

## Integration with existing DryRun features

- Reuse the current design tokens and flowchart SVG styling.
- Reuse the existing pseudocode parser, interpreter, trace renderer, type conventions, copy helper, toast system, and `sendToIDE` path.
- Leave the current text-to-flowchart converter available. It serves a different task: entering structured English or pseudocode and drawing it automatically.
- The builder's generated pseudocode must round-trip through the existing `flowchartSVG()` renderer without an error, providing an independent consistency check.

## Accessibility

- Every chart node exposes its type and label through an accessible name.
- The selected node is announced and reflected with `aria-selected` or an equivalent supported state.
- Insertion controls say exactly where the new step will be placed, including branch names.
- All operations are available without drag gestures.
- Validation messages are associated with the relevant inspector field and announced through the existing status pattern.
- SVG meaning is not communicated by shape or colour alone; decisions retain visible Yes/No labels.

## Testing

Extend the built-in self-test with pure tests for:

- every node type generating canonical structured English and pseudocode;
- nested `IF`, `WHILE`, and `REPEAT` structures;
- declaration order and type selection;
- validation with precise node IDs;
- add, edit, move, delete, undo, and redo operations;
- persistence round-trips and malformed-data recovery;
- generated pseudocode parsing, running, and drawing successfully;
- node and nesting limits.

Extend Playwright coverage with a student journey that adds input, process, loop, and output nodes; edits their values; checks the generated pseudocode; supplies input; sees a trace; reloads the page; and confirms the draft returns. Add keyboard-only coverage for selecting a node and inserting a step.

The existing `npm test` command remains the release gate.

## Acceptance criteria

- A student can build a connected flowchart without typing the chart as text.
- Sequence, input, output, process, IF / ELSE, WHILE, and REPEAT / UNTIL are supported.
- The same document generates structured English and Cambridge-style pseudocode.
- Valid generated pseudocode runs in the existing interpreter and produces a trace table.
- The student can open generated pseudocode in the existing IDE.
- Invalid or incomplete nodes are identified without losing the draft.
- Refreshing restores the latest valid or unfinished draft on the same device.
- The editor works with keyboard controls and on a narrow mobile viewport.
- Existing student data, marking, and conversion tools are unchanged.
- All core and browser tests pass.
