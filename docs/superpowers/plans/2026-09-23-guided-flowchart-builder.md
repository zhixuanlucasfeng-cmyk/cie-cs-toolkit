# Guided Flowchart Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an offline guided flowchart editor that converts one structured document into a standard diagram, structured English, Cambridge-style pseudocode, and an executable trace table.

**Architecture:** Store the student's work as a small versioned tree of structured algorithm nodes. Pure functions validate and compile that tree; existing flowchart layout primitives render it with editing metadata; the browser-only layer owns selection, history, local persistence, and integration with the existing interpreter and IDE. Keep all production code inside `index.html` and add no runtime dependency.

**Tech Stack:** Static HTML/CSS/JavaScript, existing DryRun parser/interpreter/SVG layout, localStorage, Node self-tests, Playwright Chromium

**Spec:** `docs/superpowers/specs/2026-09-23-guided-flowchart-builder-design.md`

## Global Constraints

- Production remains a self-contained `index.html` with no runtime dependency or network request.
- Preserve `dryrun.store.v3`, every legacy migration key, snapshots, import/export, learner/course ownership, question marking, and interpreter semantics.
- Store the tool draft only under `dryrun.flowchart.v1`; it does not sync or count as evidence.
- `START` and `STOP` are derived and cannot be deleted.
- Support sequence, input, output, process, `IF / ELSE`, `WHILE`, and `REPEAT / UNTIL`.
- Limit a document to 100 editable nodes and 12 nested control structures.
- Do not add arbitrary connectors or free positioning in this release.
- Every operation must work with keyboard input and at a narrow mobile viewport.
- `npm test` remains the release gate.

---

### Task 1: Define and compile the versioned flowchart document

**Files:**
- Modify: `index.html:3520-3730` (flowchart core, before the existing SVG renderer)
- Modify: `index.html:8247-8310` (built-in flowchart tests)
- Modify: `index.html:9725-9755` (Node exports)
- Modify: `tests/browser-selftest.spec.js:3-8` (remove the brittle exact-count assertion)

**Interfaces:**
- Consumes: existing `tokenize(code)`, `parseProgram(tokens)`, `runProgram(code, inputs)`, `flowchartSVG(code)` and `CIEError`
- Produces:
  - `FLOW_DOC_VERSION: 1`
  - `FLOW_DRAFT_KEY: 'dryrun.flowchart.v1'`
  - `newFlowDocument(): FlowDocument`
  - `createFlowNode(type, values?, id?): FlowNode`
  - `compileFlowDocument(doc): { english, code, lineNodeIds }`

- [x] **Step 1: Make the browser self-test assertion independent of the growing test count**

Replace the exact `235 / 235` assertion with:

```js
const heading = await page.locator('#selftest h2').textContent();
const counts = heading && heading.match(/^Self-test: (\d+) \/ (\d+) passed$/);
expect(counts).not.toBeNull();
expect(Number(counts[1])).toBe(Number(counts[2]));
expect(Number(counts[2])).toBeGreaterThanOrEqual(235);
await expect(page.locator('#selftest .f')).toHaveCount(0);
```

- [x] **Step 2: Run the browser suite to prove the harness change stays green**

Run: `npm run test:browser`

Expected: both existing tests pass, and the self-test still reports no `.f` rows.

- [x] **Step 3: Add failing core tests for the document shape and canonical compilation**

Add these named cases to `TESTS` in the Module E section:

```js
['Flow builder: a new document has editable work between fixed terminators', () => {
  const doc = newFlowDocument();
  assertEq(doc.version, 1, 'the document version should be explicit');
  assert(Array.isArray(doc.body), 'the body should be a sequence');
  assert(!JSON.stringify(doc).includes('START') && !JSON.stringify(doc).includes('STOP'),
    'terminators should be derived, not stored');
}],
['Flow builder: one document compiles to English and pseudocode', () => {
  const doc = { version:1, body:[
    { id:'n1', type:'input', name:'n', dataType:'INTEGER' },
    { id:'n2', type:'process', target:'total', expression:'0', dataType:'INTEGER' },
    { id:'n3', type:'while', condition:'n > 0', body:[
      { id:'n4', type:'process', target:'total', expression:'total + n' },
      { id:'n5', type:'process', target:'n', expression:'n - 1' }
    ]},
    { id:'n6', type:'output', expression:'total' }
  ]};
  const out = compileFlowDocument(doc);
  assert(out.english.includes('While n > 0 do') && out.english.includes('End while'),
    'English should retain the loop');
  assert(out.code.includes('DECLARE n : INTEGER') && out.code.includes('WHILE n > 0 DO'),
    'pseudocode should declare and loop');
  assertEq(runProgram(out.code, '4').env.output.join(''), '10', 'generated code should run');
  assertEq(out.lineNodeIds[out.code.split('\n').indexOf('INPUT n') + 1], 'n1',
    'generated source lines should map back to nodes');
}],
['Flow builder: nested IF and REPEAT compile without changing meaning', () => {
  const doc = { version:1, body:[
    { id:'p', type:'process', target:'x', expression:'2', dataType:'INTEGER' },
    { id:'r', type:'repeat', condition:'x = 0', body:[
      { id:'i', type:'if', condition:'x > 1', then:[
        { id:'o1', type:'output', expression:'x' }
      ], else:[
        { id:'o2', type:'output', expression:'0' }
      ]},
      { id:'d', type:'process', target:'x', expression:'x - 1' }
    ]}
  ]};
  const out = compileFlowDocument(doc);
  parseProgram(tokenize(out.code));
  assertEq(runProgram(out.code, '').env.output.join(','), '2,0', 'nested output should be preserved');
}],
```

- [x] **Step 4: Run the core suite and verify RED**

Run: `npm run test:core`

Expected: FAIL because `newFlowDocument` and `compileFlowDocument` are not defined.

- [x] **Step 5: Implement node construction and the recursive compiler**

Add a labelled `Module E1: guided flowchart document` section. Use this public shape:

```js
const FLOW_DOC_VERSION = 1;
const FLOW_DRAFT_KEY = 'dryrun.flowchart.v1';
const FLOW_TYPES = new Set(['input', 'output', 'process', 'if', 'while', 'repeat']);
let flowIdCounter = 0;

function flowId() {
  flowIdCounter += 1;
  return 'flow-' + Date.now().toString(36) + '-' + flowIdCounter.toString(36);
}

function createFlowNode(type, values, id) {
  if (!FLOW_TYPES.has(type)) throw new Error('Unknown flowchart node type: ' + type);
  const base = { id:id || flowId(), type };
  const defaults = {
    input:{ name:'value', dataType:'INTEGER' },
    output:{ expression:'value' },
    process:{ target:'value', expression:'0', dataType:'INTEGER' },
    if:{ condition:'value = 0', then:[], else:[] },
    while:{ condition:'value > 0', body:[] },
    repeat:{ condition:'value = 0', body:[] }
  };
  return Object.assign(base, defaults[type], values || {});
}

function newFlowDocument() {
  return { version:FLOW_DOC_VERSION, body:[] };
}
```

Implement `compileFlowDocument(doc)` as one recursive walk. It must:

1. collect first-use declarations in insertion order;
2. prefer an explicit `dataType`;
3. infer `STRING`, `CHAR`, `BOOLEAN`, `REAL`, or `INTEGER` only from unambiguous literals;
4. emit four spaces per nesting level;
5. record the owning node ID for each executable source line in a one-based `lineNodeIds` object;
6. emit the canonical wording from the spec for both English and pseudocode.

Use this return shape:

```js
return {
  english: englishLines.join('\n'),
  code: declarationLines.concat(codeLines).join('\n'),
  lineNodeIds
};
```

- [x] **Step 6: Export the pure interfaces and run the core suite GREEN**

Add the five constants/functions to `module.exports`, then run: `npm run test:core`

Expected: all tests pass and the total is greater than 235.

- [x] **Step 7: Commit the compiler foundation**

```bash
git add index.html tests/browser-selftest.spec.js
git commit -m "feat: compile guided flowchart documents"
```

---

### Task 2: Add immutable editing, validation, history, and safe persistence

**Files:**
- Modify: `index.html` in `Module E1`
- Modify: `index.html` Module E built-in tests
- Modify: `index.html` Node exports

**Interfaces:**
- Consumes: `FlowDocument`, `createFlowNode()`, `compileFlowDocument()` from Task 1
- Produces:
  - `flowInsert(doc, slot, node): FlowDocument`
  - `flowUpdate(doc, nodeId, patch): FlowDocument`
  - `flowDelete(doc, nodeId): FlowDocument`
  - `flowMove(doc, nodeId, delta): FlowDocument`
  - `validateFlowDocument(doc): FlowError[]`
  - `createFlowHistory(doc): FlowHistory`
  - `flowHistoryApply(history, nextDoc): FlowHistory`
  - `flowHistoryUndo(history): FlowHistory`
  - `flowHistoryRedo(history): FlowHistory`
  - `saveFlowDraft(backend, doc, inputs): void`
  - `loadFlowDraft(backend): { doc, inputs, warning }`

- [x] **Step 1: Add failing tests for nested editing and immutable results**

```js
['Flow builder: insert, update, move and delete preserve the previous document', () => {
  const start = { version:1, body:[createFlowNode('if', {}, 'if1')] };
  const inserted = flowInsert(start, { parentId:'if1', branch:'then', index:0 },
    createFlowNode('output', { expression:'1' }, 'out1'));
  assertEq(start.body[0].then.length, 0, 'editing should not mutate history');
  assertEq(inserted.body[0].then[0].id, 'out1', 'the node should enter the chosen branch');
  const updated = flowUpdate(inserted, 'out1', { expression:'2' });
  assertEq(updated.body[0].then[0].expression, '2', 'the selected node should update');
  const deleted = flowDelete(updated, 'out1');
  assertEq(deleted.body[0].then.length, 0, 'the nested node should be removable');
}],
['Flow builder: move stays inside the current sequence', () => {
  const doc = { version:1, body:[
    createFlowNode('output', { expression:'1' }, 'a'),
    createFlowNode('output', { expression:'2' }, 'b')
  ]};
  const moved = flowMove(doc, 'b', -1);
  assertEq(moved.body.map(n => n.id).join(','), 'b,a', 'move up should reorder siblings');
}],
```

- [x] **Step 2: Add failing tests for precise validation**

```js
['Flow builder: validation names the node and field that block conversion', () => {
  const doc = { version:1, body:[
    createFlowNode('input', { name:'two words' }, 'bad-name'),
    createFlowNode('while', { condition:'', body:[] }, 'bad-loop')
  ]};
  const errors = validateFlowDocument(doc);
  assert(errors.some(e => e.nodeId === 'bad-name' && e.field === 'name'), 'invalid name should be tied to its field');
  assert(errors.some(e => e.nodeId === 'bad-loop' && e.field === 'condition'), 'blank condition should be tied to its field');
  assert(errors.some(e => e.nodeId === 'bad-loop' && e.field === 'body'), 'empty loop body should be reported');
}],
['Flow builder: node and nesting safety limits are enforced', () => {
  const tooMany = { version:1, body:Array.from({ length:101 }, (_, i) =>
    createFlowNode('output', { expression:String(i) }, 'n' + i)) };
  assert(validateFlowDocument(tooMany).some(e => e.code === 'node-limit'), '101 nodes should be rejected');
  let body = [createFlowNode('output', { expression:'1' }, 'leaf')];
  for (let i = 0; i < 13; i++) body = [createFlowNode('while', { condition:'TRUE', body }, 'w' + i)];
  assert(validateFlowDocument({ version:1, body }).some(e => e.code === 'depth-limit'), 'depth 13 should be rejected');
}],
```

- [x] **Step 3: Add failing tests for undo/redo and the isolated storage key**

```js
['Flow builder: history supports undo and redo without mutating documents', () => {
  const a = newFlowDocument();
  const b = flowInsert(a, { parentId:null, branch:'body', index:0 }, createFlowNode('output', {}, 'o'));
  let h = flowHistoryApply(createFlowHistory(a), b);
  h = flowHistoryUndo(h);
  assertEq(h.present.body.length, 0, 'undo should restore the previous tree');
  h = flowHistoryRedo(h);
  assertEq(h.present.body[0].id, 'o', 'redo should restore the edit');
}],
['Flow builder: drafts round-trip and malformed JSON is not overwritten', () => {
  const mem = memoryBackend();
  const doc = { version:1, body:[createFlowNode('output', { expression:'7' }, 'o')] };
  saveFlowDraft(mem, doc, '');
  assertEq(loadFlowDraft(mem).doc.body[0].expression, '7', 'the saved draft should return');
  mem.setItem(FLOW_DRAFT_KEY, '{broken');
  const bad = loadFlowDraft(mem);
  assert(bad.warning && bad.doc.body.length === 0, 'bad data should load a safe document with a warning');
  assertEq(mem.getItem(FLOW_DRAFT_KEY), '{broken', 'bad saved data should remain untouched');
}],
```

- [x] **Step 4: Run the core suite and verify RED**

Run: `npm run test:core`

Expected: FAIL on the new editing, validation, history, and persistence symbols.

- [x] **Step 5: Implement immutable tree traversal and validation**

Use one internal sequence walker for `body`, `then`, and `else`. Every edit begins with `structuredClone(doc)` when available and a JSON clone fallback, changes the clone, and returns it. `flowInsert` validates this slot contract:

```js
// top-level
{ parentId:null, branch:'body', index:Number }
// control node child sequence
{ parentId:String, branch:'then'|'else'|'body', index:Number }
```

`validateFlowDocument` returns objects shaped as:

```js
{ nodeId:'flow-abc', field:'condition', code:'required', message:'Enter a condition.' }
```

Validate identifiers with `/^[A-Za-z][A-Za-z0-9_]*$/`, data types against `INTEGER|REAL|BOOLEAN|CHAR|STRING`, required fields, loop bodies, parser compatibility, 100 nodes, and 12 nesting levels. Empty `IF` branches are valid.

- [x] **Step 6: Implement history and backend-injected persistence**

Use this history shape and cap the past stack at 50 documents:

```js
{ past:[], present:doc, future:[] }
```

Save exactly this JSON payload:

```js
JSON.stringify({ version:FLOW_DOC_VERSION, document:doc, inputs:String(inputs || '') })
```

`loadFlowDraft` must not remove or rewrite malformed/unsupported data. It returns a starter document and a human-readable warning instead.

- [x] **Step 7: Export the pure interfaces and run the core suite GREEN**

Run: `npm run test:core`

Expected: all core tests pass.

- [x] **Step 8: Commit the safe editing model**

```bash
git add index.html
git commit -m "feat: edit and preserve flowchart drafts"
```

---

### Task 3: Render an interactive standard flowchart from the document

**Files:**
- Modify: `index.html:830-1010` (flowchart and builder styles)
- Modify: `index.html:3520-3710` (existing `fb*` layout primitives)
- Modify: `index.html` Module E built-in tests
- Modify: `index.html` Node exports

**Interfaces:**
- Consumes: `FlowDocument`, `validateFlowDocument(doc)` and existing `fbBox`, `fbSeq`, `fbIf`, `fbWhileLoop`, `fbRepeatLoop`
- Produces: `flowDocumentSVG(doc, { selectedId?, errors? }): string`

- [ ] **Step 1: Add failing tests for standard shapes and editing metadata**

```js
['Flow builder: document SVG has standard shapes and selectable nodes', () => {
  const doc = { version:1, body:[
    createFlowNode('input', { name:'n' }, 'in'),
    createFlowNode('process', { target:'x', expression:'n + 1' }, 'set'),
    createFlowNode('if', { condition:'x > 3', then:[
      createFlowNode('output', { expression:'x' }, 'out')
    ], else:[] }, 'choice')
  ]};
  const svg = flowDocumentSVG(doc, { selectedId:'choice', errors:[] });
  assert(svg.includes('data-flow-node="in"') && svg.includes('data-flow-node="choice"'), 'nodes should be addressable');
  assert(svg.includes('aria-selected="true"'), 'the selected node should be exposed');
  assert((svg.match(/<polygon/g) || []).length >= 2, 'input and decision should use standard polygons');
  assert(svg.includes('>Yes<') && svg.includes('>No<'), 'decision branches should be labelled');
}],
['Flow builder: every sequence and empty branch exposes an insertion slot', () => {
  const doc = { version:1, body:[createFlowNode('if', { then:[], else:[] }, 'choice')] };
  const svg = flowDocumentSVG(doc, {});
  assert(svg.includes('data-flow-slot="root:body:0"'), 'the root should have a first slot');
  assert(svg.includes('data-flow-slot="choice:then:0"'), 'the empty Yes branch should have a slot');
  assert(svg.includes('data-flow-slot="choice:else:0"'), 'the empty No branch should have a slot');
}],
['Flow builder: invalid nodes carry an error state without breaking SVG', () => {
  const doc = { version:1, body:[createFlowNode('while', { condition:'', body:[] }, 'loop')] };
  const svg = flowDocumentSVG(doc, { errors:validateFlowDocument(doc) });
  assert(svg.startsWith('<svg') && svg.endsWith('</svg>'), 'unfinished work should still draw');
  assert(svg.includes('data-flow-node="loop"') && svg.includes('is-error'), 'the exact node should be marked');
}],
```

- [ ] **Step 2: Run the core suite and verify RED**

Run: `npm run test:core`

Expected: FAIL because `flowDocumentSVG` is not defined.

- [ ] **Step 3: Add optional metadata to existing layout primitives**

Extend `fbShape`, `fbBox`, `fbIf`, `fbWhileLoop`, and `fbRepeatLoop` with an optional final `meta` argument while preserving every current caller. When `meta.nodeId` exists, wrap the shape and its label in:

```html
<g class="flow-node is-selected is-error"
   data-flow-node="node-id"
   role="button"
   tabindex="0"
   aria-selected="true"
   aria-label="Decision: x &gt; 3"></g>
```

Only include `is-selected`, `is-error`, or `aria-selected="true"` when applicable. Escape every ID and label with the existing helpers.

- [ ] **Step 4: Implement document-to-layout conversion with insertion slots**

Add `fbSlot(slotKey, label)` as a small circular `+` control with `data-flow-slot`, `role="button"`, `tabindex="0"`, and a precise accessible label. Build each sequence as:

```js
slot(0), node(0), slot(1), node(1), ... slot(length)
```

`flowDocumentSVG` recursively maps:

- `input` and `output` to `fbBox('io', ...)`;
- `process` to `fbBox('process', ...)`;
- `if` to `fbIf(condition, thenBlock, elseBlock, meta)`;
- `while` to `fbWhileLoop(condition, bodyBlock, meta)`;
- `repeat` to `fbRepeatLoop(condition, bodyBlock, meta)`.

Use slot keys exactly as `parentId-or-root:branch:index`, for example `root:body:2` and `choice:else:0`. Always render `START`, the editable body with slots, and `STOP`.

- [ ] **Step 5: Add builder-specific SVG styles**

Add styles using existing tokens for `.flow-node`, `.flow-slot`, `.is-selected`, and `.is-error`. Required behavior:

```css
.flow-node { cursor:pointer; }
.flow-node.is-selected > :first-child { stroke:var(--accent); stroke-width:3; }
.flow-node.is-error > :first-child { stroke:var(--danger); stroke-width:3; }
.flow-slot { cursor:pointer; }
.flow-slot circle { fill:var(--surface); stroke:var(--border-strong); }
.flow-slot:focus-visible circle, .flow-slot:hover circle { stroke:var(--accent); stroke-width:2; }
```

Keep visible focus and dark-theme compatibility; do not hard-code colours.

- [ ] **Step 6: Export and verify both old and new renderers**

Run: `npm run test:core`

Expected: all old `flowchartSVG` tests and new `flowDocumentSVG` tests pass.

- [ ] **Step 7: Commit the interactive renderer**

```bash
git add index.html
git commit -m "feat: render editable flowchart documents"
```

---

### Task 4: Build the accessible flowchart editing interface

**Files:**
- Modify: `index.html:830-1010` (responsive builder layout and controls)
- Modify: `index.html:1460-1585` (Pseudocode Lab tabs and new panel)
- Modify: `index.html:11535-11625` (builder state, render loop and events)

**Interfaces:**
- Consumes: Task 2 editing/history functions and Task 3 `flowDocumentSVG()`
- Produces: browser-only `renderFlowBuilder()`, `selectFlowNode(id)`, `selectFlowSlot(slot)` and UI controls under `#p-flow-build`

- [ ] **Step 1: Add the tab and semantic HTML shell**

Insert a `Build a flowchart` tab before the existing text-based `Flowchart` tab. Add a `#p-flow-build` tabpanel containing:

```html
<div class="flow-builder-tools" role="toolbar" aria-label="Add a flowchart step">
  <button class="btn" data-add-flow="input">Input</button>
  <button class="btn" data-add-flow="output">Output</button>
  <button class="btn" data-add-flow="process">Process</button>
  <button class="btn" data-add-flow="if">IF / ELSE</button>
  <button class="btn" data-add-flow="while">WHILE</button>
  <button class="btn" data-add-flow="repeat">REPEAT / UNTIL</button>
  <button class="btn" id="flow-undo" disabled>Undo</button>
  <button class="btn" id="flow-redo" disabled>Redo</button>
  <button class="btn" id="flow-example">Example</button>
  <button class="btn danger" id="flow-reset">Reset</button>
</div>
<div class="flow-builder-grid">
  <section class="panel" aria-labelledby="flow-chart-title">
    <div class="panel-head"><h2 id="flow-chart-title">Your flowchart</h2></div>
    <div class="panel-body scroll-x" id="flow-builder-canvas"></div>
  </section>
  <aside class="panel" aria-labelledby="flow-inspector-title">
    <div class="panel-head"><h2 id="flow-inspector-title">Selected step</h2></div>
    <div class="panel-body" id="flow-builder-inspector"></div>
  </aside>
</div>
<div id="flow-builder-status" class="status" role="status" aria-live="polite"></div>
```

- [ ] **Step 2: Update the lab tab registry**

Add `['tab-flow-build', 'p-flow-build']` to `LABTABS`. Keep roving `tabindex` and `aria-selected` behavior unchanged so the existing accessibility self-test covers the new tab.

- [ ] **Step 3: Add responsive layout styles**

Use a two-column grid with a minimum 360px inspector-safe canvas column and stack it below 800px. Preserve `.scroll-x` on the chart. Buttons must retain the site's minimum target sizes; do not introduce icon-only controls.

- [ ] **Step 4: Initialize browser state and render the selected-node inspector**

Use this state shape:

```js
let flowHistory = createFlowHistory(newFlowDocument());
let flowSelectedId = null;
let flowSelectedSlot = { parentId:null, branch:'body', index:0 };
let flowInputs = '';
```

`renderFlowBuilder()` must:

1. validate `flowHistory.present`;
2. render `flowDocumentSVG` into `#flow-builder-canvas`;
3. render fields appropriate to the selected node type;
4. associate field errors with the field using `aria-describedby`;
5. disable Undo/Redo according to history stacks;
6. never replace the current document because it is temporarily invalid.

- [ ] **Step 5: Wire node, slot, toolbar, inspector, move, and delete events**

Use event delegation on `#flow-builder-canvas`. Click or Enter/Space on `[data-flow-node]` selects that node. The same actions on `[data-flow-slot]` parse the exact slot and select it. Toolbar actions insert at the selected slot, or immediately after the selected node in its sibling sequence.

Inspector `input` events call `flowUpdate`. Provide labelled Move up, Move down, and Delete buttons. Deleting an `if`, `while`, or `repeat` with nested children requires `confirm()` and states how many nested steps will be removed.

- [ ] **Step 6: Wire undo, redo, example, and reset**

The example is the approved total-from-`n` WHILE chart from Task 1. Reset asks for confirmation when the document contains any node. Undo/redo restore document state and clear a selected ID that no longer exists.

- [ ] **Step 7: Run the browser suite and manually inspect both themes**

Run: `npm run test:browser`

Expected: existing browser tests pass; the new tab boots without uncaught errors. Open the local page at desktop and 390px width, toggle dark mode, and confirm the chart, inspector, toolbar, focus rings, and horizontal scrolling remain usable.

- [ ] **Step 8: Commit the editing interface**

```bash
git add index.html
git commit -m "feat: add guided flowchart editing UI"
```

---

### Task 5: Generate results, trace execution, autosave, and open in the IDE

**Files:**
- Modify: `index.html` inside `#p-flow-build` (results panels)
- Modify: `index.html` builder browser logic near `renderFlowBuilder()`
- Modify: `index.html` existing `sendToIDE()` integration
- Modify: `tests/browser-selftest.spec.js`

**Interfaces:**
- Consumes: `compileFlowDocument()`, `validateFlowDocument()`, `runProgram()`, `traceHTML()`, `saveFlowDraft()`, `loadFlowDraft()`, `sendToIDE()`
- Produces: live `#flow-builder-english`, `#flow-builder-code`, `#flow-builder-trace`, `#flow-builder-inputs`, Copy buttons and `#flow-builder-ide`

- [ ] **Step 1: Add a failing end-to-end student journey**

Add a Playwright test named `student builds, runs and restores a flowchart`. It must:

1. load `/` and open Pseudocode Lab → Build a flowchart;
2. reset the chart;
3. add Input `n`, Process `total ← 0`, WHILE `n > 0`, the two body processes, and Output `total` through visible controls;
4. assert the generated pseudocode contains `WHILE n > 0 DO` and `OUTPUT total`;
5. enter `4`, run the trace, and assert output `10` appears;
6. reload and confirm the nodes and generated code return.

Use accessible roles and labels instead of CSS implementation selectors wherever possible.

- [ ] **Step 2: Run the new journey and verify RED**

Run: `npx playwright test -g "student builds, runs and restores a flowchart"`

Expected: FAIL because the result panels, trace action, and autosave integration are not implemented yet.

- [ ] **Step 3: Add the result panel markup**

Below the builder grid, add three panels:

- Structured English with a read-only `<pre>` and Copy button.
- Cambridge pseudocode with a read-only `<pre>`, Copy, and Open in IDE buttons.
- Trace table with a sample-input textarea and a Run trace button.

Use the established panel, button, status, control, and trace-table classes.

- [ ] **Step 4: Compile after every edit without guessing through validation errors**

If `validateFlowDocument` has blocking errors, keep the previous result panels visible but mark them stale and disable Copy, Run trace, and Open in IDE. If there are no errors, call `compileFlowDocument`, update both textual results, and verify `parseProgram(tokenize(result.code))` before enabling actions.

- [ ] **Step 5: Run and display the trace through the existing interpreter**

On Run trace:

```js
const run = runProgram(compiled.code, $('flow-builder-inputs').value);
$('flow-builder-trace').innerHTML = run.steps.length
  ? traceHTML(run.steps, false)
  : '<div class="empty">This program has no steps to trace.</div>';
```

On interpreter failure, preserve the chart and generated text, show the exact error in the builder status, and display `Not traced.` in the trace panel.

- [ ] **Step 6: Wire Copy and Open in IDE**

Use the existing `copyText()` helper. Open in IDE calls:

```js
sendToIDE(compiled.code, $('flow-builder-inputs').value);
```

Do not create a second code editor inside the builder.

- [ ] **Step 7: Autosave the document and sample input after changes**

Load once during builder initialization:

```js
const restored = loadFlowDraft(window.localStorage);
flowHistory = createFlowHistory(restored.doc);
flowInputs = restored.inputs;
```

After every document edit and input change, call `saveFlowDraft(window.localStorage, flowHistory.present, flowInputs)` inside `try/catch`. Storage refusal shows a non-blocking warning; it must not prevent editing. If `restored.warning` exists, show it without overwriting the saved raw value.

- [ ] **Step 8: Run the new journey GREEN, then run full verification**

Run:

```bash
npx playwright test -g "student builds, runs and restores a flowchart"
npm test
```

Expected: the student journey passes; every core self-test passes; the public self-test has equal pass and total counts; all Playwright tests pass.

- [ ] **Step 9: Commit conversion, tracing, and persistence integration**

```bash
git add index.html tests/browser-selftest.spec.js
git commit -m "feat: run and restore student flowcharts"
```

---

### Task 6: Lock keyboard and mobile behavior with Chromium tests and document the feature

**Files:**
- Modify: `tests/browser-selftest.spec.js`
- Modify: `README.md`
- Modify: `index.html` only if a test exposes a real defect

**Interfaces:**
- Consumes: the complete public UI from Tasks 1-5
- Produces: browser regressions for creation, conversion, tracing, persistence, keyboard operation, and mobile layout

- [ ] **Step 1: Add keyboard-only coverage**

Add a test that focuses the first insertion slot, presses Enter, activates Output from the toolbar, focuses the new chart node, presses Enter, edits the expression, and confirms the selected-node inspector and pseudocode update without a pointer.

- [ ] **Step 2: Add a 390px mobile layout check**

Set viewport `{ width:390, height:844 }`, open the builder, assert the toolbar, chart, inspector, and results are visible, and assert `document.documentElement.scrollWidth === document.documentElement.clientWidth`. The chart's own `.scroll-x` region may scroll horizontally.

- [ ] **Step 3: Run all browser tests and fix only observed defects**

Run: `npm run test:browser`

Expected: public self-test, ordinary boot, creation/persistence, keyboard, and mobile tests all pass with zero uncaught page errors.

- [ ] **Step 4: Update README without introducing another stale assertion count**

Add the guided builder to the Pseudocode Lab description. Replace the fixed `235 self-tests` wording with `The built-in self-test covers...` so future test additions do not make the documentation false. Keep the documented `npm test` commands unchanged.

- [ ] **Step 5: Run the final release gate and consistency checks**

Run:

```bash
npm test
git diff --check origin/main...HEAD
rg -n "235 self-tests|T[B]D|T[O]DO|implement[[:space:]]+later" README.md docs/superpowers/specs/2026-09-23-guided-flowchart-builder-design.md docs/superpowers/plans/2026-09-23-guided-flowchart-builder.md
```

Expected: all tests pass; `git diff --check` exits 0; the scan prints no stale count or placeholder.

- [ ] **Step 6: Commit the release coverage and documentation**

```bash
git add tests/browser-selftest.spec.js README.md index.html
git commit -m "test: cover guided flowchart student journey"
```

## Plan self-review

- The document model, editing operations, limits, validation, rendering, accessibility, persistence, conversions, trace execution, IDE handoff, mobile behavior, and testing each map to an implementation task.
- Function names and data shapes are consistent across all tasks.
- Existing text-to-flowchart conversion remains untouched and available in its current tab.
- The only production file is `index.html`; Playwright remains development-only.
- No account, backend, runtime package, arbitrary connector, or progress integration is introduced.
