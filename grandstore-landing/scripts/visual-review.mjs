import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH ||
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
try {
  await fs.mkdir("artifacts", { recursive: true });
  page.on("pageerror", (error) => console.log("ERROR", error.message));
  page.on("console", (message) => {
    if (message.type() === "warning") console.log("WARN", message.text());
  });
  await page.goto("http://127.0.0.1:5176");
  await page.locator(".bottle-scene.is-ready").waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const img of document.images) img.loading = "eager";
    await Promise.all(
      [...document.images].map((img) => img.decode().catch(() => {}))
    );
  });
  await page.getByRole("button", { name: "Pause bottle animation" }).click();
  await page.screenshot({ path: "artifacts/desktop-hero.png" });
  for (const id of [
    "collection",
    "our-story",
    "international",
    "experiences",
    "auctions",
  ]) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await page.locator(`#${id}`).screenshot({ path: `artifacts/${id}.png` });
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(800);
  await page.screenshot({ path: "artifacts/full-desktop.png", fullPage: true });
  console.log(
    "DARK TOKENS",
    await page.evaluate(() => ({
      root: getComputedStyle(document.documentElement).getPropertyValue(
        "--ink"
      ),
      body: getComputedStyle(document.body).color,
      brand: getComputedStyle(document.querySelector(".brand")).color,
      theme: document.documentElement.dataset.theme,
      style: document.body.getAttribute("style"),
    }))
  );
  await page.screenshot({ path: "artifacts/dark-hero.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "artifacts/mobile-hero.png" });
  await page.locator("#international").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page
    .locator("#international")
    .screenshot({ path: "artifacts/mobile-world.png" });
  console.log("VISUAL REVIEW CAPTURED");
} finally {
  await browser.close();
}
