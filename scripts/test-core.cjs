const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/);

if (!match) {
  console.error('Could not find DryRun core script in index.html');
  process.exit(1);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dryrun-core-'));
const tempFile = path.join(tempDir, 'core.cjs');
fs.writeFileSync(tempFile, match[1]);

try {
  const { runSelfTest } = require(tempFile);
  const results = runSelfTest();
  const failures = results.filter(result => !result.ok);

  for (const failure of failures) {
    console.error(`FAIL ${failure.name}\n${failure.err}`);
  }

  const passed = results.length - failures.length;
  console.log(`${passed}/${results.length}`);
  process.exitCode = failures.length ? 1 : 0;
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
