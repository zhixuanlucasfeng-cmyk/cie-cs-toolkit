const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium'
  },
  webServer: {
    command: 'npm run build && node scripts/serve.cjs',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI
  }
});
