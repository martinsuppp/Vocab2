const { chromium } = require('playwright');
(async () => {
  console.log("Starting playwright...");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  await page.goto('http://localhost:4173/#/memory');
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
  console.log("Done.");
})();
