import { defineConfig } from "@playwright/test";
import fs from "node:fs";

const windowsChrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const executablePath =
  process.env.CHROME_PATH ||
  (process.platform === "win32" && fs.existsSync(windowsChrome)
    ? windowsChrome
    : undefined);
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:5176",
    headless: true,
    launchOptions: {
      executablePath,
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --strictPort",
    url: "http://127.0.0.1:5176",
    reuseExistingServer: true,
    timeout: 30000,
  },
});
