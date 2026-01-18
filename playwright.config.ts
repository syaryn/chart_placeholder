import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:8000",
    viewport: { width: 1280, height: 720 },
    browserName: "chromium",
    channel: "chrome",
  },
  webServer: {
    command:
      "/home/takuma/.local/share/mise/installs/deno/2.6.5/bin/deno serve --allow-net --allow-read main.ts",
    url: "http://127.0.0.1:8000",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
