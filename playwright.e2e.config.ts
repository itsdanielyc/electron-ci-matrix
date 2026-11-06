// L6: the real shell. Playwright's Electron support launches the built app
// (out/, from `npm run build`), not the dev server, and drives its window.
// One worker: each test file launches its own app instance.
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "test-results/e2e",
  forbidOnly: !!process.env.CI,
  // The doctrine allows one retry at L6 for genuine environmental noise.
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: process.env.CI ? [["list"], ["html", { open: "never", outputFolder: "playwright-report/e2e" }]] : "list",
  use: {
    trace: "retain-on-failure",
  },
});
