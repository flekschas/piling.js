/* eslint no-await-in-loop:0 */
const puppeteer = require('puppeteer');

const numItems = 200;

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
      path: `logs/scrolling-trace-${numItems}-${i}.json`
    });

    await page.evaluate(async () => {
      const scrollContainer = document.querySelector(
        '.pilingjs-scroll-container'
      );
      const scrollHeight = document
        .querySelector('.pilingjs-scroll-element')
        .getBoundingClientRect().height;
      const scrollStepSize = 6;
      const scrollSteps = scrollHeight / scrollStepSize;

      let scrollTop = 0;

      const scrollToInElement = y =>
        new Promise(resolve => {
          window.requestAnimationFrame(() => {
            scrollContainer.scrollTop = parseInt(y, 10);
            resolve();
          });
        });

      // scroll to the bottom
      for (let j = 0; j < scrollSteps; j++) {
        scrollTop += scrollStepSize;
        await scrollToInElement(scrollTop);
      }
    });

    // stop the tracing
    await page.tracing.stop();

    await page.close();

    await page.waitFor(500);
  }

  // close the browser
  await browser.close();
})();
