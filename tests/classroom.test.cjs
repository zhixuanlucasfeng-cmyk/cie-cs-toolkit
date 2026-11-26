const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
const context = { module:{exports:{}}, console };
vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
const { runProgram, createRun } = context.module.exports;
for (const sample of require('./classroom-programs.cjs')) {
  test(sample.name, () => {
    const result = runProgram(sample.code, sample.inputs || '');
    assert.equal(result.env.output.join('\n'), sample.output);
  });
}
test('interactive INPUT inside a function suspends and resumes without losing execution', () => {
  const sample = require('./classroom-programs.cjs').find(s => s.name === 'function reads input');
  const run = createRun(sample.code, '', {interactive:true});
  run.advance(100);
  assert.equal(run.state, 'WAITING_FOR_INPUT');
  assert.equal(run.provideInput('8').ok, true);
  while (run.advance(100)) {}
  assert.equal(run.state, 'FINISHED');
  assert.equal(run.env.output.join('\n'), '16');
});
test('a called routine sees globals, not the caller local variables', () => {
  assert.equal(runProgram(`DECLARE n : INTEGER
n ← 10
FUNCTION ReadGlobal() RETURNS INTEGER
RETURN n
ENDFUNCTION
PROCEDURE Outer(n : INTEGER)
OUTPUT ReadGlobal()
ENDPROCEDURE
CALL Outer(99)`, '').env.output.join('\n'), '10');
});
test('grouped parameters share an explicit type', () => {
  assert.equal(runProgram(`FUNCTION Add(a, b : INTEGER) RETURNS INTEGER
RETURN a + b
ENDFUNCTION
OUTPUT Add(3, 4)`, '').env.output.join('\n'), '7');
});
test('function execution yields so Stop and step limits can interrupt it', () => {
  const code = 'FUNCTION Forever() RETURNS INTEGER\nWHILE TRUE\nENDWHILE\nRETURN 0\nENDFUNCTION\nOUTPUT Forever()';
  const run = createRun(code, '', {maxSteps:20});
  run.advance(2);
  assert.equal(run.state, 'RUNNING');
  assert.equal(run.stepCount, 2);
  run.stop();
  assert.equal(run.stopped, true);
  assert.throws(() => runProgram(code, '', {maxSteps:20}), /Execution passed 20 steps/);
});
test('RETURN values and CALL/FUNCTION distinctions still produce useful errors', () => {
  assert.throws(() => runProgram('FUNCTION Bad() RETURNS INTEGER\nRETURN "x"\nENDFUNCTION\nOUTPUT Bad()', ''), /INTEGER/);
  assert.throws(() => runProgram('FUNCTION Missing() RETURNS INTEGER\nOUTPUT "hi"\nENDFUNCTION\nOUTPUT Missing()', ''), /without a RETURN/);
  assert.throws(() => runProgram('PROCEDURE P()\nENDPROCEDURE\nOUTPUT P()', ''), /PROCEDURE/);
});
