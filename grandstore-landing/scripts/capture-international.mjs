import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const page = await browser.newPage({ viewport: { width: 1528, height: 732 } });
  await page.goto("http://localhost:5176/#international", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const section = page.locator("#international");
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  // Worldwide (Default)
  await section.screenshot({ path: "artifacts/international-tab.png" });

  // Click South Africa tab
  const saTab = page.locator(".world-tab", { hasText: "South Africa" });
  await saTab.click();
  await page.waitForTimeout(600);
  await section.screenshot({ path: "artifacts/south-africa-tab.png" });

  await browser.close();
  console.log("Both tab screenshots captured successfully!");
}

main().catch(console.error);
