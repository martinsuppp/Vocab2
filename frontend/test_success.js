const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let crashed = false;
  page.on('pageerror', error => {
      console.log('BROWSER PAGE ERROR:', error.message);
      crashed = true;
  });
  try {
      await page.goto('http://localhost:4173/', { waitUntil: 'load', timeout: 5000 });
      await new Promise(r => setTimeout(r, 2000));
      if (!crashed) {
          console.log("SUCCESS: Page loaded without errors.");
      }
  } catch (e) {
      console.log('PLAYWRIGHT ERROR:', e.message);
  }
  await browser.close();
})();
