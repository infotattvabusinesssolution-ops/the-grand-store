import { chromium } from 'playwright';

async function verify() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  
  // Mobile test
  const mobileContext = await browser.newContext({
    viewport: { width: 414, height: 896 },
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:4176/#experiences', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);

  const expSectionMobile = mobilePage.locator('#experiences');
  await expSectionMobile.scrollIntoViewIfNeeded();
  await mobilePage.waitForTimeout(800);

  const outDir = 'C:/Users/RITESH/.gemini/antigravity-ide/brain/f54edd9f-0d14-49e2-8d87-b16da8ede5fb';
  await expSectionMobile.screenshot({
    path: `${outDir}/experiences_mobile.png`,
  });
  console.log('Saved experiences_mobile.png');

  await browser.close();
}

verify().catch(console.error);
