import { readFileSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// The prototype's own port, never the dev server's: E2E_PORT if 4173 is taken.
const port = Number(process.env.E2E_PORT) || 4173;
// Browser locale follows the documents, so dates and numbers read as the product's.
const lang = JSON.parse(
  readFileSync("src/generated/doc-index.json", "utf8"),
).lang;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: true,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  // Four screenshots a step: a long path outgrows the default 30 seconds.
  timeout: 90_000,
  use: {
    baseURL: `http://localhost:${port}`,
    locale: lang === "ru" ? "ru-RU" : "en-US",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npx vite preview --port ${port} --strictPort`,
    port,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
