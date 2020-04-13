/* eslint no-await-in-loop:0 */
const puppeteer = require('puppeteer');

const numItems = 5000;

(async () => {
  // launch puppeteer browser in headful mode
  const browser = await puppeteer.launch({
    headless: false,
    // devtools: true,
    args: [`--window-size=${1024},${768}`]
  });

  for (let i = 0; i < 10; i++) {
    // start a page instance in the browser
    const page = await browser.newPage();
    await page.setViewport({ width: 1024, height: 678 });

    // go to the page
    await page.goto('http://localhost:8080/?example=drawings');

    // or you can wait for div#piling-ready to appear:
    await page.waitForSelector('#piling-ready', { timeout: 90000 });
    await page.waitFor(500 * (numItems / 250));

    // start the profiling, with a path to the out file and screenshots collected
    await page.tracing.start({
      path: `logs/arrangement-trace-${numItems}-${i}-alt.json`
    });

    await page.evaluate(async () =>
      window.pilingjs.arrangeBy('uv', 'umapEmbedding')
    );

    // stop the tracing
    await page.tracing.stop();

    await page.close();

    await page.waitFor(500);
  }

  // close the browser
  await browser.close();
})();
