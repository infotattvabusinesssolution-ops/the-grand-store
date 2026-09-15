import { chromium } from "@playwright/test";
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";
import fs from "node:fs/promises";

// Own Chrome through Playwright to avoid chrome-launcher's Windows temp-folder
// cleanup race. The debug connection is local and the browser is closed below.
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    (process.platform === "win32"
      ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
      : undefined),
  headless: true,
  args: [
    "--remote-debugging-port=9226",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
try {
  const result = await lighthouse(
    "http://127.0.0.1:4176",
    {
      port: 9226,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    },
    desktopConfig
  );
  await fs.mkdir("artifacts", { recursive: true });
  await fs.writeFile("artifacts/lighthouse-desktop.json", result.report);
  console.log(
    JSON.stringify(
      {
        scores: Object.fromEntries(
          Object.entries(result.lhr.categories).map(([key, value]) => [
            key,
            Math.round(value.score * 100),
          ])
        ),
        metrics: Object.fromEntries(
          [
            "first-contentful-paint",
            "largest-contentful-paint",
            "cumulative-layout-shift",
            "total-blocking-time",
          ].map((key) => [key, result.lhr.audits[key].displayValue])
        ),
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
