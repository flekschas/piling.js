/* eslint no-await-in-loop:0 */
const { performance } = require('perf_hooks');
const puppeteer = require('puppeteer');

(async () => {
  // launch puppeteer browser in headful mode
  const browser = await puppeteer.launch({
    headless: false
  });

  for (let i = 0; i < 11; i++) {
    // start a page instance in the browser
    const page = await browser.newPage();

    // go to the page
    await page.goto('http://localhost:8080/?example=matrices&mode=white');

    // or you can wait for div#piling-start to appear:
    await page.waitForSelector('#piling-start', { timeout: 120000 });

    // start measuring time
    const start = performance.now();

    // or you can wait for div#piling-ready to appear:
    await page.waitForSelector('#piling-ready', { timeout: 120000 });

    // eslint-disable-next-line no-console
    console.log(`Took ${performance.now() - start} msec`);

    await page.close();

    await page.waitFor(1000);
  }

  // close the browser
  await browser.close();
})();
