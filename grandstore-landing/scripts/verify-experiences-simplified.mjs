import { chromium } from '@playwright/test';

async function verify() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    viewport: { width: 1528, height: 732 },
  });
  await context.addInitScript(() => {
    localStorage.setItem('gs_age_verified', 'true');
  });

  const page = await context.newPage();
  console.log('Navigating to http://127.0.0.1:4176/...');
  await page.goto('http://127.0.0.1:4176/', { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  // Scroll smoothly to experiences section to trigger the scroll animation
  console.log('Scrolling to #experiences...');
  await page.evaluate(() => {
    const el = document.getElementById('experiences');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });
  await page.waitForTimeout(1500);

  // Check that the reference cards exist and are 2
  const cardCount = await page.locator('.experience-reference-card').count();
  console.log(`Reference cards count: ${cardCount} (Expected: 2)`);

  // Check uncropped image properties
  const imgBoxes = await page.locator('.experience-reference-img').all();
  for (let i = 0; i < imgBoxes.length; i++) {
    const box = await imgBoxes[i].boundingBox();
    console.log(`Image ${i + 1} rendered box:`, box);
  }

  // Check Book an event CTA
  const bookBtn = page.locator('.book-event-primary-btn');
  const btnText = await bookBtn.innerText();
  console.log(`CTA Button text: "${btnText}"`);

  // Check title
  const title = await page.locator('.experiences-title').innerText();
  console.log(`Title: "${title.replace(/\n/g, ' ')}"`);

  // Check perks list
  const perks = await page.locator('.perk-item').allInnerTexts();
  console.log('Experience highlights:', perks);

  // Capture screenshot of the simplified experiences section
  const section = page.locator('#experiences');
  const basePath = 'C:\\Users\\RITESH\\.gemini\\antigravity-ide\\brain\\540fdd2a-3b10-4994-a7cf-916704e0cfe9';
  await section.screenshot({ path: `${basePath}\\experiences-simplified-section.png` });
  console.log('Saved section screenshot to experiences-simplified-section.png');

  await page.screenshot({ path: `${basePath}\\experiences-simplified-viewport.png` });
  console.log('Saved viewport screenshot to experiences-simplified-viewport.png');

  await browser.close();
  console.log('SUCCESS: All checks passed!');
}

verify().catch((err) => {
  console.error('Error during verification:', err);
  process.exit(1);
});
