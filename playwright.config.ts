import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
  },
  webServer: {
    command: "npm run dev:web -- --host localhost --port 5173 --strictPort",
    port: 5173,
    reuseExistingServer: true,
  },
})
